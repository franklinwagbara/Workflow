using FlowForge.Application.DTOs;

namespace FlowForge.Application.Interfaces;

public interface IExecutionService
{
    Task<WorkflowExecutionDto> ExecuteWorkflowAsync(Guid workflowId, ExecuteWorkflowDto dto, CancellationToken ct = default);
    Task<WorkflowExecutionDto> SimulateWorkflowAsync(Guid workflowId, ExecuteWorkflowDto dto, CancellationToken ct = default);
    Task<WorkflowExecutionDto?> GetExecutionAsync(Guid executionId, CancellationToken ct = default);
    Task<IEnumerable<WorkflowExecutionDto>> GetExecutionsForWorkflowAsync(Guid workflowId, CancellationToken ct = default);
}
