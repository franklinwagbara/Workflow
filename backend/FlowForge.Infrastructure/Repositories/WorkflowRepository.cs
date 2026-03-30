using FlowForge.Application.Interfaces;
using FlowForge.Domain.Entities;
using FlowForge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Repositories;

public class WorkflowRepository : IWorkflowRepository
{
    private readonly FlowForgeDbContext _context;

    public WorkflowRepository(FlowForgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Workflow>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Workflows
            .OrderByDescending(w => w.UpdatedAt)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<Workflow?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Workflows
            .Include(w => w.Versions.OrderByDescending(v => v.VersionNumber).Take(5))
            .FirstOrDefaultAsync(w => w.Id == id, ct);
    }

    public async Task<Workflow> CreateAsync(Workflow workflow, CancellationToken ct = default)
    {
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync(ct);
        return workflow;
    }

    public async Task<Workflow> UpdateAsync(Workflow workflow, CancellationToken ct = default)
    {
        workflow.UpdatedAt = DateTime.UtcNow;
        _context.Workflows.Update(workflow);
        await _context.SaveChangesAsync(ct);
        return workflow;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var workflow = await _context.Workflows.FindAsync([id], ct);
        if (workflow is not null)
        {
            _context.Workflows.Remove(workflow);
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<IEnumerable<WorkflowVersion>> GetVersionsAsync(Guid workflowId, CancellationToken ct = default)
    {
        return await _context.WorkflowVersions
            .Where(v => v.WorkflowId == workflowId)
            .OrderByDescending(v => v.VersionNumber)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<WorkflowVersion?> GetVersionAsync(Guid workflowId, int versionNumber, CancellationToken ct = default)
    {
        return await _context.WorkflowVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.WorkflowId == workflowId && v.VersionNumber == versionNumber, ct);
    }

    public async Task<WorkflowVersion> CreateVersionAsync(WorkflowVersion version, CancellationToken ct = default)
    {
        _context.WorkflowVersions.Add(version);
        await _context.SaveChangesAsync(ct);
        return version;
    }
}
