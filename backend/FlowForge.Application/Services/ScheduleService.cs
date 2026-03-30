using FlowForge.Application.DTOs;
using FlowForge.Application.Interfaces;
using FlowForge.Domain.Entities;
using Hangfire;
using Microsoft.Extensions.Logging;

namespace FlowForge.Application.Services;

public class ScheduleService : IScheduleService
{
    private readonly IScheduleRepository _scheduleRepo;
    private readonly IWorkflowRepository _workflowRepo;
    private readonly IExecutionService _executionService;
    private readonly IRecurringJobManager _recurringJobManager;
    private readonly ILogger<ScheduleService> _logger;

    public ScheduleService(
        IScheduleRepository scheduleRepo,
        IWorkflowRepository workflowRepo,
        IExecutionService executionService,
        IRecurringJobManager recurringJobManager,
        ILogger<ScheduleService> logger)
    {
        _scheduleRepo = scheduleRepo;
        _workflowRepo = workflowRepo;
        _executionService = executionService;
        _recurringJobManager = recurringJobManager;
        _logger = logger;
    }

    public async Task<IEnumerable<ScheduleDto>> GetSchedulesAsync(Guid workflowId, CancellationToken ct = default)
    {
        var schedules = await _scheduleRepo.GetByWorkflowIdAsync(workflowId, ct);
        return schedules.Select(MapToDto);
    }

    public async Task<ScheduleDto> CreateScheduleAsync(Guid workflowId, CreateScheduleDto dto, CancellationToken ct = default)
    {
        var workflow = await _workflowRepo.GetByIdAsync(workflowId, ct)
            ?? throw new InvalidOperationException($"Workflow {workflowId} not found");

        var schedule = new WorkflowSchedule
        {
            WorkflowId = workflowId,
            CronExpression = dto.CronExpression,
            IsActive = true
        };

        var created = await _scheduleRepo.CreateAsync(schedule, ct);

        // Register Hangfire recurring job
        var jobId = $"workflow-{workflowId}-schedule-{created.Id}";
        created.HangfireJobId = jobId;
        await _scheduleRepo.UpdateAsync(created, ct);

        _recurringJobManager.AddOrUpdate(
            jobId,
            () => _executionService.ExecuteWorkflowAsync(workflowId, new ExecuteWorkflowDto(null), CancellationToken.None),
            dto.CronExpression
        );

        _logger.LogInformation("Created schedule {ScheduleId} for workflow {WorkflowId}", created.Id, workflowId);
        return MapToDto(created);
    }

    public async Task<ScheduleDto?> ToggleScheduleAsync(Guid scheduleId, CancellationToken ct = default)
    {
        var schedule = await _scheduleRepo.GetByIdAsync(scheduleId, ct);
        if (schedule is null) return null;

        schedule.IsActive = !schedule.IsActive;
        await _scheduleRepo.UpdateAsync(schedule, ct);

        if (schedule.HangfireJobId is not null)
        {
            if (schedule.IsActive)
            {
                _recurringJobManager.AddOrUpdate(
                    schedule.HangfireJobId,
                    () => _executionService.ExecuteWorkflowAsync(schedule.WorkflowId, new ExecuteWorkflowDto(null), CancellationToken.None),
                    schedule.CronExpression
                );
            }
            else
            {
                _recurringJobManager.RemoveIfExists(schedule.HangfireJobId);
            }
        }

        return MapToDto(schedule);
    }

    public async Task DeleteScheduleAsync(Guid scheduleId, CancellationToken ct = default)
    {
        var schedule = await _scheduleRepo.GetByIdAsync(scheduleId, ct);
        if (schedule?.HangfireJobId is not null)
        {
            _recurringJobManager.RemoveIfExists(schedule.HangfireJobId);
        }
        await _scheduleRepo.DeleteAsync(scheduleId, ct);
    }

    private static ScheduleDto MapToDto(WorkflowSchedule schedule) => new(
        schedule.Id,
        schedule.WorkflowId,
        schedule.CronExpression,
        schedule.IsActive,
        schedule.LastRunAt,
        schedule.NextRunAt,
        schedule.CreatedAt
    );
}
