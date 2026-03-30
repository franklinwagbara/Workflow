namespace FlowForge.Domain.Entities;

public class WorkflowSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowId { get; set; }
    public string CronExpression { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? HangfireJobId { get; set; }
    public DateTime? LastRunAt { get; set; }
    public DateTime? NextRunAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Workflow Workflow { get; set; } = null!;
}
