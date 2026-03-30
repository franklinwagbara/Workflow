using FlowForge.Application.DTOs;

namespace FlowForge.Application.Interfaces;

public interface IWorkflowService
{
    Task<IEnumerable<WorkflowListDto>> GetAllAsync(CancellationToken ct = default);
    Task<WorkflowDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<WorkflowDetailDto> CreateAsync(CreateWorkflowDto dto, CancellationToken ct = default);
    Task<WorkflowDetailDto?> UpdateAsync(Guid id, UpdateWorkflowDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<WorkflowVersionDto>> GetVersionsAsync(Guid workflowId, CancellationToken ct = default);
    Task<WorkflowVersionDetailDto?> GetVersionAsync(Guid workflowId, int versionNumber, CancellationToken ct = default);
    Task<WorkflowDetailDto?> RevertToVersionAsync(Guid workflowId, int versionNumber, CancellationToken ct = default);
}
