using FlowForge.Domain.Enums;

namespace FlowForge.Application.DTOs;

// ========== Workflow DTOs ==========

public record WorkflowListDto(
    Guid Id,
    string Name,
    string Description,
    WorkflowStatus Status,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record WorkflowDetailDto(
    Guid Id,
    string Name,
    string Description,
    WorkflowStatus Status,
    int Version,
    string GraphData,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<WorkflowVersionDto> RecentVersions
);

public record CreateWorkflowDto(
    string Name,
    string Description,
    string? GraphData
);

public record UpdateWorkflowDto(
    string? Name,
    string? Description,
    string? GraphData,
    WorkflowStatus? Status,
    string? ChangeDescription
);

public record WorkflowVersionDto(
    Guid Id,
    int VersionNumber,
    string ChangeDescription,
    DateTime CreatedAt
);

public record WorkflowVersionDetailDto(
    Guid Id,
    int VersionNumber,
    string GraphData,
    string ChangeDescription,
    DateTime CreatedAt
);

// ========== Execution DTOs ==========

public record ExecuteWorkflowDto(
    string? InputData
);

public record WorkflowExecutionDto(
    Guid Id,
    Guid WorkflowId,
    ExecutionStatus Status,
    DateTime StartedAt,
    DateTime? CompletedAt,
    string? ErrorMessage,
    List<NodeExecutionResultDto> NodeResults
);

public record NodeExecutionResultDto(
    Guid Id,
    string NodeId,
    ExecutionStatus Status,
    string InputData,
    string OutputData,
    string? ErrorMessage,
    long ExecutionTimeMs,
    int ExecutionOrder
);

// ========== Schedule DTOs ==========

public record CreateScheduleDto(
    string CronExpression
);

public record ScheduleDto(
    Guid Id,
    Guid WorkflowId,
    string CronExpression,
    bool IsActive,
    DateTime? LastRunAt,
    DateTime? NextRunAt,
    DateTime CreatedAt
);

// ========== Graph DTOs (for execution engine) ==========

public record GraphDataDto(
    List<GraphNodeDto> Nodes,
    List<GraphEdgeDto> Edges
);

public record GraphNodeDto(
    string Id,
    string Type,
    GraphNodeDataDto Data,
    GraphNodePositionDto Position
);

public record GraphNodeDataDto(
    string Label,
    string? Description,
    NodeConfigDto? Config
);

public record NodeConfigDto(
    string? Url,
    string? Method,
    string? Headers,
    string? Body,
    string? ConditionExpression,
    string? TrueLabel,
    string? FalseLabel,
    int? DelayMs,
    string? TransformExpression
);

public record GraphNodePositionDto(
    double X,
    double Y
);

public record GraphEdgeDto(
    string Id,
    string Source,
    string Target,
    string? SourceHandle,
    string? Label
);
