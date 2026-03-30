using FlowForge.Domain.Entities;

namespace FlowForge.Application.Interfaces;

public interface IScheduleRepository
{
    Task<IEnumerable<WorkflowSchedule>> GetByWorkflowIdAsync(Guid workflowId, CancellationToken ct = default);
    Task<WorkflowSchedule?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<WorkflowSchedule> CreateAsync(WorkflowSchedule schedule, CancellationToken ct = default);
    Task<WorkflowSchedule> UpdateAsync(WorkflowSchedule schedule, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
