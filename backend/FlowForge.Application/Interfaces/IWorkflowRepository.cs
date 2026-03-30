using FlowForge.Domain.Entities;

namespace FlowForge.Application.Interfaces;

public interface IWorkflowRepository
{
    Task<IEnumerable<Workflow>> GetAllAsync(CancellationToken ct = default);
    Task<Workflow?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Workflow> CreateAsync(Workflow workflow, CancellationToken ct = default);
    Task<Workflow> UpdateAsync(Workflow workflow, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<WorkflowVersion>> GetVersionsAsync(Guid workflowId, CancellationToken ct = default);
    Task<WorkflowVersion?> GetVersionAsync(Guid workflowId, int versionNumber, CancellationToken ct = default);
    Task<WorkflowVersion> CreateVersionAsync(WorkflowVersion version, CancellationToken ct = default);
}
