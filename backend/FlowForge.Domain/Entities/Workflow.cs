using FlowForge.Domain.Enums;

namespace FlowForge.Domain.Entities;

public class Workflow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Draft;
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Serialized graph data (nodes + edges as JSON)
    public string GraphData { get; set; } = "{}";

    // Navigation properties
    public ICollection<WorkflowVersion> Versions { get; set; } = new List<WorkflowVersion>();
    public ICollection<WorkflowExecution> Executions { get; set; } = new List<WorkflowExecution>();
    public ICollection<WorkflowSchedule> Schedules { get; set; } = new List<WorkflowSchedule>();
}
