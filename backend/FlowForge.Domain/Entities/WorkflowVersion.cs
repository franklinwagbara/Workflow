namespace FlowForge.Domain.Entities;

public class WorkflowVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowId { get; set; }
    public int VersionNumber { get; set; }
    public string GraphData { get; set; } = "{}";
    public string ChangeDescription { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Workflow Workflow { get; set; } = null!;
}
