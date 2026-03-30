using FlowForge.Application.DTOs;
using FlowForge.Application.Interfaces;
using FlowForge.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace FlowForge.Application.Services;

public class WorkflowService : IWorkflowService
{
    private readonly IWorkflowRepository _repository;
    private readonly ILogger<WorkflowService> _logger;

    public WorkflowService(IWorkflowRepository repository, ILogger<WorkflowService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<IEnumerable<WorkflowListDto>> GetAllAsync(CancellationToken ct = default)
    {
        var workflows = await _repository.GetAllAsync(ct);
        return workflows.Select(w => new WorkflowListDto(
            w.Id, w.Name, w.Description, w.Status, w.Version, w.CreatedAt, w.UpdatedAt
        ));
    }

    public async Task<WorkflowDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var workflow = await _repository.GetByIdAsync(id, ct);
        if (workflow is null) return null;
        return MapToDetail(workflow);
    }

    public async Task<WorkflowDetailDto> CreateAsync(CreateWorkflowDto dto, CancellationToken ct = default)
    {
        var workflow = new Workflow
        {
            Name = dto.Name,
            Description = dto.Description,
            GraphData = dto.GraphData ?? GetDefaultGraphData()
        };

        var created = await _repository.CreateAsync(workflow, ct);

        // Create initial version
        await _repository.CreateVersionAsync(new WorkflowVersion
        {
            WorkflowId = created.Id,
            VersionNumber = 1,
            GraphData = created.GraphData,
            ChangeDescription = "Initial version"
        }, ct);

        _logger.LogInformation("Created workflow {WorkflowId}: {Name}", created.Id, created.Name);
        return MapToDetail(created);
    }

    public async Task<WorkflowDetailDto?> UpdateAsync(Guid id, UpdateWorkflowDto dto, CancellationToken ct = default)
    {
        var workflow = await _repository.GetByIdAsync(id, ct);
        if (workflow is null) return null;

        bool graphChanged = false;

        if (dto.Name is not null) workflow.Name = dto.Name;
        if (dto.Description is not null) workflow.Description = dto.Description;
        if (dto.Status.HasValue) workflow.Status = dto.Status.Value;

        if (dto.GraphData is not null && dto.GraphData != workflow.GraphData)
        {
            workflow.GraphData = dto.GraphData;
            graphChanged = true;
        }

        if (graphChanged)
        {
            workflow.Version++;
            await _repository.CreateVersionAsync(new WorkflowVersion
            {
                WorkflowId = workflow.Id,
                VersionNumber = workflow.Version,
                GraphData = workflow.GraphData,
                ChangeDescription = dto.ChangeDescription ?? $"Version {workflow.Version}"
            }, ct);
        }

        var updated = await _repository.UpdateAsync(workflow, ct);
        _logger.LogInformation("Updated workflow {WorkflowId}", updated.Id);
        return MapToDetail(updated);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        await _repository.DeleteAsync(id, ct);
        _logger.LogInformation("Deleted workflow {WorkflowId}", id);
    }

    public async Task<IEnumerable<WorkflowVersionDto>> GetVersionsAsync(Guid workflowId, CancellationToken ct = default)
    {
        var versions = await _repository.GetVersionsAsync(workflowId, ct);
        return versions.Select(v => new WorkflowVersionDto(
            v.Id, v.VersionNumber, v.ChangeDescription, v.CreatedAt
        ));
    }

    public async Task<WorkflowVersionDetailDto?> GetVersionAsync(Guid workflowId, int versionNumber, CancellationToken ct = default)
    {
        var version = await _repository.GetVersionAsync(workflowId, versionNumber, ct);
        if (version is null) return null;
        return new WorkflowVersionDetailDto(
            version.Id, version.VersionNumber, version.GraphData, version.ChangeDescription, version.CreatedAt
        );
    }

    public async Task<WorkflowDetailDto?> RevertToVersionAsync(Guid workflowId, int versionNumber, CancellationToken ct = default)
    {
        var version = await _repository.GetVersionAsync(workflowId, versionNumber, ct);
        if (version is null) return null;

        var workflow = await _repository.GetByIdAsync(workflowId, ct);
        if (workflow is null) return null;

        workflow.GraphData = version.GraphData;
        workflow.Version++;

        await _repository.CreateVersionAsync(new WorkflowVersion
        {
            WorkflowId = workflow.Id,
            VersionNumber = workflow.Version,
            GraphData = workflow.GraphData,
            ChangeDescription = $"Reverted to version {versionNumber}"
        }, ct);

        var updated = await _repository.UpdateAsync(workflow, ct);
        _logger.LogInformation("Reverted workflow {WorkflowId} to version {Version}", workflowId, versionNumber);
        return MapToDetail(updated);
    }

    private static WorkflowDetailDto MapToDetail(Workflow workflow)
    {
        return new WorkflowDetailDto(
            workflow.Id,
            workflow.Name,
            workflow.Description,
            workflow.Status,
            workflow.Version,
            workflow.GraphData,
            workflow.CreatedAt,
            workflow.UpdatedAt,
            workflow.Versions?.Select(v => new WorkflowVersionDto(
                v.Id, v.VersionNumber, v.ChangeDescription, v.CreatedAt
            )).ToList() ?? []
        );
    }

    private static string GetDefaultGraphData()
    {
        return System.Text.Json.JsonSerializer.Serialize(new
        {
            nodes = new[]
            {
                new
                {
                    id = "trigger-1",
                    type = "trigger",
                    position = new { x = 250, y = 50 },
                    data = new { label = "Start Trigger", description = "Workflow entry point" }
                }
            },
            edges = Array.Empty<object>()
        });
    }
}
