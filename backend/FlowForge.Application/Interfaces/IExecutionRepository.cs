using FlowForge.Domain.Entities;

namespace FlowForge.Application.Interfaces;

public interface IExecutionRepository
{
    Task<WorkflowExecution> CreateAsync(WorkflowExecution execution, CancellationToken ct = default);
    Task<WorkflowExecution?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<WorkflowExecution>> GetByWorkflowIdAsync(Guid workflowId, CancellationToken ct = default);
    Task<WorkflowExecution> UpdateAsync(WorkflowExecution execution, CancellationToken ct = default);
    Task<NodeExecutionResult> AddNodeResultAsync(NodeExecutionResult result, CancellationToken ct = default);
}
