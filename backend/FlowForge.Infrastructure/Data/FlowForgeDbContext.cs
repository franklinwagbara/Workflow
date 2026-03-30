using FlowForge.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Data;

public class FlowForgeDbContext : DbContext
{
    public FlowForgeDbContext(DbContextOptions<FlowForgeDbContext> options) : base(options) { }

    public DbSet<Workflow> Workflows => Set<Workflow>();
    public DbSet<WorkflowVersion> WorkflowVersions => Set<WorkflowVersion>();
    public DbSet<WorkflowExecution> WorkflowExecutions => Set<WorkflowExecution>();
    public DbSet<NodeExecutionResult> NodeExecutionResults => Set<NodeExecutionResult>();
    public DbSet<WorkflowSchedule> WorkflowSchedules => Set<WorkflowSchedule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Workflow>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2048);
            entity.Property(e => e.GraphData).IsRequired();
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<WorkflowVersion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.GraphData).IsRequired();
            entity.HasOne(e => e.Workflow)
                  .WithMany(w => w.Versions)
                  .HasForeignKey(e => e.WorkflowId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.WorkflowId, e.VersionNumber }).IsUnique();
        });

        modelBuilder.Entity<WorkflowExecution>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExecutionLog).IsRequired();
            entity.HasOne(e => e.Workflow)
                  .WithMany(w => w.Executions)
                  .HasForeignKey(e => e.WorkflowId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.StartedAt);
        });

        modelBuilder.Entity<NodeExecutionResult>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NodeId).HasMaxLength(256).IsRequired();
            entity.HasOne(e => e.Execution)
                  .WithMany(ex => ex.NodeResults)
                  .HasForeignKey(e => e.ExecutionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.ExecutionId, e.NodeId });
        });

        modelBuilder.Entity<WorkflowSchedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CronExpression).HasMaxLength(128).IsRequired();
            entity.HasOne(e => e.Workflow)
                  .WithMany(w => w.Schedules)
                  .HasForeignKey(e => e.WorkflowId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
