using FlowForge.Application.DTOs;

namespace FlowForge.Application.Interfaces;

public interface IScheduleService
{
    Task<IEnumerable<ScheduleDto>> GetSchedulesAsync(Guid workflowId, CancellationToken ct = default);
    Task<ScheduleDto> CreateScheduleAsync(Guid workflowId, CreateScheduleDto dto, CancellationToken ct = default);
    Task<ScheduleDto?> ToggleScheduleAsync(Guid scheduleId, CancellationToken ct = default);
    Task DeleteScheduleAsync(Guid scheduleId, CancellationToken ct = default);
}
