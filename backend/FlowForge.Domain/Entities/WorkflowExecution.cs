using FlowForge.Domain.Enums;

namespace FlowForge.Domain.Entities;

public class WorkflowExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowId { get; set; }
    public ExecutionStatus Status { get; set; } = ExecutionStatus.Pending;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }

    // JSON-serialized execution log: per-node results
    public string ExecutionLog { get; set; } = "[]";

    // Input data provided for the execution
    public string InputData { get; set; } = "{}";

    // Navigation
    public Workflow Workflow { get; set; } = null!;
    public ICollection<NodeExecutionResult> NodeResults { get; set; } = new List<NodeExecutionResult>();
}
