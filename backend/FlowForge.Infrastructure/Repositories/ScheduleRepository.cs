using FlowForge.Application.Interfaces;
using FlowForge.Domain.Entities;
using FlowForge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Repositories;

public class ScheduleRepository : IScheduleRepository
{
    private readonly FlowForgeDbContext _context;

    public ScheduleRepository(FlowForgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkflowSchedule>> GetByWorkflowIdAsync(Guid workflowId, CancellationToken ct = default)
    {
        return await _context.WorkflowSchedules
            .Where(s => s.WorkflowId == workflowId)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<WorkflowSchedule?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.WorkflowSchedules.FindAsync([id], ct);
    }

    public async Task<WorkflowSchedule> CreateAsync(WorkflowSchedule schedule, CancellationToken ct = default)
    {
        _context.WorkflowSchedules.Add(schedule);
        await _context.SaveChangesAsync(ct);
        return schedule;
    }

    public async Task<WorkflowSchedule> UpdateAsync(WorkflowSchedule schedule, CancellationToken ct = default)
    {
        _context.WorkflowSchedules.Update(schedule);
        await _context.SaveChangesAsync(ct);
        return schedule;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var schedule = await _context.WorkflowSchedules.FindAsync([id], ct);
        if (schedule is not null)
        {
            _context.WorkflowSchedules.Remove(schedule);
            await _context.SaveChangesAsync(ct);
        }
    }
}
