using FlowForge.Application.Interfaces;
using FlowForge.Domain.Entities;
using FlowForge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Repositories;

public class ExecutionRepository : IExecutionRepository
{
    private readonly FlowForgeDbContext _context;

    public ExecutionRepository(FlowForgeDbContext context)
    {
        _context = context;
    }

    public async Task<WorkflowExecution> CreateAsync(WorkflowExecution execution, CancellationToken ct = default)
    {
        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync(ct);
        return execution;
    }

    public async Task<WorkflowExecution?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.WorkflowExecutions
            .Include(e => e.NodeResults.OrderBy(n => n.ExecutionOrder))
            .FirstOrDefaultAsync(e => e.Id == id, ct);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetByWorkflowIdAsync(Guid workflowId, CancellationToken ct = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId)
            .OrderByDescending(e => e.StartedAt)
            .Include(e => e.NodeResults.OrderBy(n => n.ExecutionOrder))
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<WorkflowExecution> UpdateAsync(WorkflowExecution execution, CancellationToken ct = default)
    {
        _context.WorkflowExecutions.Update(execution);
        await _context.SaveChangesAsync(ct);
        return execution;
    }

    public async Task<NodeExecutionResult> AddNodeResultAsync(NodeExecutionResult result, CancellationToken ct = default)
    {
        _context.NodeExecutionResults.Add(result);
        await _context.SaveChangesAsync(ct);
        return result;
    }
}
