// ========== Enums ==========
export enum NodeType {
  Trigger = "trigger",
  Action = "action",
  Condition = "condition",
  Delay = "delay",
}

export enum WorkflowStatus {
  Draft = "Draft",
  Active = "Active",
  Archived = "Archived",
}

export enum ExecutionStatus {
  Pending = "Pending",
  Running = "Running",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

// ========== Node Config ==========
export interface NodeConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  conditionExpression?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  trueLabel?: string;
  falseLabel?: string;
  delayMs?: number;
  triggerType?: string;
  transformExpression?: string;
  [key: string]: unknown;
}

export interface NodeData {
  label: string;
  description?: string;
  config?: NodeConfig;
  executionStatus?: ExecutionStatus;
  executionOutput?: Record<string, unknown>;
  executionTimeMs?: number;
  errorMessage?: string;
  [key: string]: unknown;
}

// ========== Workflow DTOs ==========
export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDetail {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: number;
  graphData: string;
  createdAt: string;
  updatedAt: string;
  recentVersions: WorkflowVersion[];
}

export interface WorkflowVersion {
  id: string;
  versionNumber: number;
  changeDescription: string;
  createdAt: string;
}

export interface WorkflowVersionDetail {
  id: string;
  versionNumber: number;
  graphData: string;
  changeDescription: string;
  createdAt: string;
}

// ========== Execution DTOs ==========
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  nodeResults: NodeExecutionResult[];
}

export interface NodeExecutionResult {
  id: string;
  nodeId: string;
  status: ExecutionStatus;
  inputData: string;
  outputData: string;
  errorMessage?: string;
  executionTimeMs: number;
  executionOrder: number;
}

// ========== Schedule DTOs ==========
export interface Schedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

// ========== Graph Data ==========
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}
