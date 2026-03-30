using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;
using FlowForge.Application.DTOs;
using FlowForge.Application.Interfaces;
using FlowForge.Domain.Entities;
using FlowForge.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace FlowForge.Application.Services;

public class ExecutionService : IExecutionService
{
    private readonly IWorkflowRepository _workflowRepo;
    private readonly IExecutionRepository _executionRepo;
    private readonly ILogger<ExecutionService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public ExecutionService(
        IWorkflowRepository workflowRepo,
        IExecutionRepository executionRepo,
        ILogger<ExecutionService> logger)
    {
        _workflowRepo = workflowRepo;
        _executionRepo = executionRepo;
        _logger = logger;
    }

    public async Task<WorkflowExecutionDto> ExecuteWorkflowAsync(
        Guid workflowId, ExecuteWorkflowDto dto, CancellationToken ct = default)
    {
        return await RunWorkflowAsync(workflowId, dto, isSimulation: false, ct);
    }

    public async Task<WorkflowExecutionDto> SimulateWorkflowAsync(
        Guid workflowId, ExecuteWorkflowDto dto, CancellationToken ct = default)
    {
        return await RunWorkflowAsync(workflowId, dto, isSimulation: true, ct);
    }

    public async Task<WorkflowExecutionDto?> GetExecutionAsync(Guid executionId, CancellationToken ct = default)
    {
        var execution = await _executionRepo.GetByIdAsync(executionId, ct);
        return execution is null ? null : MapToDto(execution);
    }

    public async Task<IEnumerable<WorkflowExecutionDto>> GetExecutionsForWorkflowAsync(
        Guid workflowId, CancellationToken ct = default)
    {
        var executions = await _executionRepo.GetByWorkflowIdAsync(workflowId, ct);
        return executions.Select(MapToDto);
    }

    private async Task<WorkflowExecutionDto> RunWorkflowAsync(
        Guid workflowId, ExecuteWorkflowDto dto, bool isSimulation, CancellationToken ct)
    {
        var workflow = await _workflowRepo.GetByIdAsync(workflowId, ct)
            ?? throw new InvalidOperationException($"Workflow {workflowId} not found");

        var graph = JsonSerializer.Deserialize<GraphDataDto>(workflow.GraphData, JsonOptions)
            ?? throw new InvalidOperationException("Invalid graph data");

        var execution = await _executionRepo.CreateAsync(new WorkflowExecution
        {
            WorkflowId = workflowId,
            Status = ExecutionStatus.Running,
            InputData = dto.InputData ?? "{}"
        }, ct);

        try
        {
            var context = new ExecutionContext
            {
                Data = ParseJsonToDict(dto.InputData ?? "{}"),
                NodeOutputs = new Dictionary<string, JsonObject>(),
                IsSimulation = isSimulation
            };

            // Build adjacency list
            var adjacency = BuildAdjacencyList(graph);
            var triggerNodes = graph.Nodes.Where(n =>
                n.Type.Equals("trigger", StringComparison.OrdinalIgnoreCase)).ToList();

            if (triggerNodes.Count == 0)
                throw new InvalidOperationException("No trigger node found in workflow");

            int order = 0;
            var visited = new HashSet<string>();
            var queue = new Queue<string>();

            foreach (var trigger in triggerNodes)
                queue.Enqueue(trigger.Id);

            while (queue.Count > 0)
            {
                ct.ThrowIfCancellationRequested();
                var nodeId = queue.Dequeue();

                if (!visited.Add(nodeId)) continue;

                var node = graph.Nodes.FirstOrDefault(n => n.Id == nodeId);
                if (node is null) continue;

                var sw = Stopwatch.StartNew();
                var nodeResult = await ExecuteNodeAsync(node, context, graph.Edges, ct);
                sw.Stop();

                var resultEntity = await _executionRepo.AddNodeResultAsync(new NodeExecutionResult
                {
                    ExecutionId = execution.Id,
                    NodeId = nodeId,
                    Status = nodeResult.Success ? ExecutionStatus.Completed : ExecutionStatus.Failed,
                    InputData = JsonSerializer.Serialize(nodeResult.Input, JsonOptions),
                    OutputData = JsonSerializer.Serialize(nodeResult.Output, JsonOptions),
                    ErrorMessage = nodeResult.Error,
                    ExecutionTimeMs = sw.ElapsedMilliseconds,
                    ExecutionOrder = order++
                }, ct);

                if (!nodeResult.Success)
                {
                    execution.Status = ExecutionStatus.Failed;
                    execution.ErrorMessage = $"Node {nodeId} failed: {nodeResult.Error}";
                    execution.CompletedAt = DateTime.UtcNow;
                    await _executionRepo.UpdateAsync(execution, ct);
                    break;
                }

                // Store output for downstream nodes
                context.NodeOutputs[nodeId] = nodeResult.Output;

                // Determine next nodes
                var nextNodeIds = GetNextNodes(nodeId, nodeResult, graph.Edges);
                foreach (var nextId in nextNodeIds)
                {
                    if (!visited.Contains(nextId))
                        queue.Enqueue(nextId);
                }
            }

            if (execution.Status == ExecutionStatus.Running)
            {
                execution.Status = ExecutionStatus.Completed;
                execution.CompletedAt = DateTime.UtcNow;
                await _executionRepo.UpdateAsync(execution, ct);
            }

            _logger.LogInformation(
                "Workflow {WorkflowId} execution {ExecutionId} completed with status {Status}",
                workflowId, execution.Id, execution.Status);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            execution.Status = ExecutionStatus.Failed;
            execution.ErrorMessage = ex.Message;
            execution.CompletedAt = DateTime.UtcNow;
            await _executionRepo.UpdateAsync(execution, ct);
            _logger.LogError(ex, "Workflow execution {ExecutionId} failed", execution.Id);
        }

        // Reload with results
        var result = await _executionRepo.GetByIdAsync(execution.Id, ct);
        return MapToDto(result!);
    }

    private async Task<NodeExecutionOutput> ExecuteNodeAsync(
        GraphNodeDto node, ExecutionContext context, List<GraphEdgeDto> edges, CancellationToken ct)
    {
        var input = BuildNodeInput(node, context);

        try
        {
            return node.Type.ToLowerInvariant() switch
            {
                "trigger" => ExecuteTriggerNode(node, input),
                "action" => await ExecuteActionNodeAsync(node, input, context, ct),
                "condition" => ExecuteConditionNode(node, input, context),
                "delay" => await ExecuteDelayNodeAsync(node, input, context, ct),
                _ => new NodeExecutionOutput
                {
                    Success = false,
                    Input = input,
                    Output = new JsonObject(),
                    Error = $"Unknown node type: {node.Type}"
                }
            };
        }
        catch (Exception ex)
        {
            return new NodeExecutionOutput
            {
                Success = false,
                Input = input,
                Output = new JsonObject(),
                Error = ex.Message
            };
        }
    }

    private static NodeExecutionOutput ExecuteTriggerNode(GraphNodeDto node, JsonObject input)
    {
        return new NodeExecutionOutput
        {
            Success = true,
            Input = input,
            Output = new JsonObject
            {
                ["triggered"] = true,
                ["timestamp"] = DateTime.UtcNow.ToString("O"),
                ["nodeId"] = node.Id
            }
        };
    }

    private async Task<NodeExecutionOutput> ExecuteActionNodeAsync(
        GraphNodeDto node, JsonObject input, ExecutionContext context, CancellationToken ct)
    {
        var config = node.Data.Config;

        if (context.IsSimulation)
        {
            // In simulation mode, generate mock response
            await Task.Delay(50, ct); // Simulate network latency
            return new NodeExecutionOutput
            {
                Success = true,
                Input = input,
                Output = new JsonObject
                {
                    ["simulated"] = true,
                    ["url"] = config?.Url ?? "N/A",
                    ["method"] = config?.Method ?? "GET",
                    ["statusCode"] = 200,
                    ["responseBody"] = new JsonObject { ["message"] = "Simulated response" },
                    ["timestamp"] = DateTime.UtcNow.ToString("O")
                }
            };
        }

        // Real execution: make HTTP call
        if (config?.Url is not null)
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            var method = new HttpMethod(config.Method ?? "GET");
            var request = new HttpRequestMessage(method, config.Url);

            if (config.Headers is not null)
            {
                var headers = JsonSerializer.Deserialize<Dictionary<string, string>>(config.Headers);
                if (headers is not null)
                {
                    foreach (var (key, value) in headers)
                        request.Headers.TryAddWithoutValidation(key, value);
                }
            }

            if (config.Body is not null && method != HttpMethod.Get)
            {
                request.Content = new StringContent(config.Body, System.Text.Encoding.UTF8, "application/json");
            }

            var response = await httpClient.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            return new NodeExecutionOutput
            {
                Success = response.IsSuccessStatusCode,
                Input = input,
                Output = new JsonObject
                {
                    ["statusCode"] = (int)response.StatusCode,
                    ["responseBody"] = body,
                    ["timestamp"] = DateTime.UtcNow.ToString("O")
                },
                Error = response.IsSuccessStatusCode ? null : $"HTTP {(int)response.StatusCode}: {body}"
            };
        }

        // Transform action (no URL, just data transformation)
        return new NodeExecutionOutput
        {
            Success = true,
            Input = input,
            Output = new JsonObject
            {
                ["transformed"] = true,
                ["data"] = input.DeepClone(),
                ["timestamp"] = DateTime.UtcNow.ToString("O")
            }
        };
    }

    private static NodeExecutionOutput ExecuteConditionNode(
        GraphNodeDto node, JsonObject input, ExecutionContext context)
    {
        var config = node.Data.Config;
        var expression = config?.ConditionExpression ?? "true";
        var result = EvaluateCondition(expression, context);

        return new NodeExecutionOutput
        {
            Success = true,
            Input = input,
            Output = new JsonObject
            {
                ["conditionResult"] = result,
                ["expression"] = expression,
                ["branch"] = result ? (config?.TrueLabel ?? "true") : (config?.FalseLabel ?? "false"),
                ["timestamp"] = DateTime.UtcNow.ToString("O")
            },
            ConditionResult = result
        };
    }

    private static async Task<NodeExecutionOutput> ExecuteDelayNodeAsync(
        GraphNodeDto node, JsonObject input, ExecutionContext context, CancellationToken ct)
    {
        var delayMs = node.Data.Config?.DelayMs ?? 1000;

        if (context.IsSimulation)
            delayMs = Math.Min(delayMs, 100); // Cap simulation delay

        await Task.Delay(delayMs, ct);

        return new NodeExecutionOutput
        {
            Success = true,
            Input = input,
            Output = new JsonObject
            {
                ["delayed"] = true,
                ["delayMs"] = delayMs,
                ["timestamp"] = DateTime.UtcNow.ToString("O")
            }
        };
    }

    private static bool EvaluateCondition(string expression, ExecutionContext context)
    {
        // Simple expression evaluator supporting:
        // - "true" / "false"
        // - "{{nodeId.field}} operator value"
        // - Basic comparison operators: ==, !=, >, <, >=, <=

        expression = expression.Trim();

        if (bool.TryParse(expression, out var boolResult))
            return boolResult;

        // Replace template variables: {{nodeId.field}}
        var resolved = ResolveTemplateVariables(expression, context);

        // Try to evaluate simple comparison
        var operators = new[] { ">=", "<=", "!=", "==", ">", "<" };
        foreach (var op in operators)
        {
            var parts = resolved.Split(op, 2, StringSplitOptions.TrimEntries);
            if (parts.Length == 2)
            {
                return EvaluateComparison(parts[0], op, parts[1]);
            }
        }

        // Default: try parsing as boolean
        return !string.IsNullOrWhiteSpace(resolved) && resolved != "0" && resolved.ToLower() != "false";
    }

    private static string ResolveTemplateVariables(string expression, ExecutionContext context)
    {
        var result = expression;
        // Match {{nodeId.field}} patterns
        var regex = new System.Text.RegularExpressions.Regex(@"\{\{(\w+)\.(\w+)\}\}");
        var matches = regex.Matches(expression);

        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            var nodeId = match.Groups[1].Value;
            var field = match.Groups[2].Value;

            if (context.NodeOutputs.TryGetValue(nodeId, out var output))
            {
                var value = output[field]?.ToString() ?? "";
                result = result.Replace(match.Value, value);
            }
        }

        return result;
    }

    private static bool EvaluateComparison(string left, string op, string right)
    {
        // Try numeric comparison first
        if (double.TryParse(left, out var leftNum) && double.TryParse(right, out var rightNum))
        {
            return op switch
            {
                "==" => Math.Abs(leftNum - rightNum) < 0.0001,
                "!=" => Math.Abs(leftNum - rightNum) >= 0.0001,
                ">" => leftNum > rightNum,
                "<" => leftNum < rightNum,
                ">=" => leftNum >= rightNum,
                "<=" => leftNum <= rightNum,
                _ => false
            };
        }

        // String comparison
        return op switch
        {
            "==" => left.Equals(right, StringComparison.OrdinalIgnoreCase),
            "!=" => !left.Equals(right, StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    private static List<string> GetNextNodes(string nodeId, NodeExecutionOutput result, List<GraphEdgeDto> edges)
    {
        var outEdges = edges.Where(e => e.Source == nodeId).ToList();

        if (result.ConditionResult.HasValue)
        {
            // For condition nodes, route based on handle
            var branch = result.ConditionResult.Value ? "true" : "false";
            return outEdges
                .Where(e => e.SourceHandle == null || e.SourceHandle == branch)
                .Select(e => e.Target)
                .ToList();
        }

        return outEdges.Select(e => e.Target).ToList();
    }

    private static Dictionary<string, List<string>> BuildAdjacencyList(GraphDataDto graph)
    {
        var adjacency = new Dictionary<string, List<string>>();
        foreach (var edge in graph.Edges)
        {
            if (!adjacency.ContainsKey(edge.Source))
                adjacency[edge.Source] = new List<string>();
            adjacency[edge.Source].Add(edge.Target);
        }
        return adjacency;
    }

    private static JsonObject BuildNodeInput(GraphNodeDto node, ExecutionContext context)
    {
        var input = new JsonObject();

        foreach (var (key, value) in context.Data)
        {
            input[key] = JsonValue.Create(value);
        }

        // Include outputs from previous nodes
        var previousDataObj = new JsonObject();
        foreach (var (nodeId, output) in context.NodeOutputs)
        {
            previousDataObj[nodeId] = output.DeepClone();
        }
        input["_previousOutputs"] = previousDataObj;

        return input;
    }

    private static Dictionary<string, object> ParseJsonToDict(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(json) ?? new();
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }

    private static WorkflowExecutionDto MapToDto(WorkflowExecution execution)
    {
        return new WorkflowExecutionDto(
            execution.Id,
            execution.WorkflowId,
            execution.Status,
            execution.StartedAt,
            execution.CompletedAt,
            execution.ErrorMessage,
            execution.NodeResults.Select(nr => new NodeExecutionResultDto(
                nr.Id,
                nr.NodeId,
                nr.Status,
                nr.InputData,
                nr.OutputData,
                nr.ErrorMessage,
                nr.ExecutionTimeMs,
                nr.ExecutionOrder
            )).OrderBy(nr => nr.ExecutionOrder).ToList()
        );
    }

    // Internal types
    private class ExecutionContext
    {
        public Dictionary<string, object> Data { get; set; } = new();
        public Dictionary<string, JsonObject> NodeOutputs { get; set; } = new();
        public bool IsSimulation { get; set; }
    }

    private class NodeExecutionOutput
    {
        public bool Success { get; set; }
        public JsonObject Input { get; set; } = new();
        public JsonObject Output { get; set; } = new();
        public string? Error { get; set; }
        public bool? ConditionResult { get; set; }
    }
}
