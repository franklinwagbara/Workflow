using FlowForge.Domain.Enums;

namespace FlowForge.Domain.Entities;

public class NodeExecutionResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ExecutionId { get; set; }
    public string NodeId { get; set; } = string.Empty;
    public ExecutionStatus Status { get; set; } = ExecutionStatus.Pending;
    public string InputData { get; set; } = "{}";
    public string OutputData { get; set; } = "{}";
    public string? ErrorMessage { get; set; }
    public long ExecutionTimeMs { get; set; }
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    public int ExecutionOrder { get; set; }

    // Navigation
    public WorkflowExecution Execution { get; set; } = null!;
}
