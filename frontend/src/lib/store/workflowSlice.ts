import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Node, Edge } from "@xyflow/react";
import { workflowApi } from "../api/client";
import {
  WorkflowListItem,
  WorkflowDetail,
  WorkflowVersion,
  NodeData,
  NodeType,
  WorkflowStatus,
} from "../types";
import { v4 as uuidv4 } from "uuid";

// ========== History for Undo/Redo ==========
interface HistoryEntry {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface WorkflowState {
  // Workflow list
  workflows: WorkflowListItem[];
  currentWorkflow: WorkflowDetail | null;
  loading: boolean;
  error: string | null;

  // Graph state
  nodes: Node<NodeData>[];
  edges: Edge[];

  // Undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;

  // Versions
  versions: WorkflowVersion[];

  // Dirty tracking
  isDirty: boolean;
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  loading: false,
  error: null,
  nodes: [],
  edges: [],
  history: [],
  historyIndex: -1,
  maxHistory: 50,
  versions: [],
  isDirty: false,
};

// ========== Async Thunks ==========
export const fetchWorkflows = createAsyncThunk(
  "workflow/fetchAll",
  async () => await workflowApi.getAll(),
);

export const fetchWorkflow = createAsyncThunk(
  "workflow/fetchById",
  async (id: string) => await workflowApi.getById(id),
);

export const createWorkflow = createAsyncThunk(
  "workflow/create",
  async (data: { name: string; description: string }) =>
    await workflowApi.create(data),
);

export const saveWorkflow = createAsyncThunk(
  "workflow/save",
  async ({
    id,
    graphData,
    changeDescription,
  }: {
    id: string;
    graphData: string;
    changeDescription?: string;
  }) => await workflowApi.update(id, { graphData, changeDescription }),
);

export const deleteWorkflow = createAsyncThunk(
  "workflow/delete",
  async (id: string) => {
    await workflowApi.delete(id);
    return id;
  },
);

export const fetchVersions = createAsyncThunk(
  "workflow/fetchVersions",
  async (workflowId: string) => await workflowApi.getVersions(workflowId),
);

export const revertToVersion = createAsyncThunk(
  "workflow/revertToVersion",
  async ({
    workflowId,
    versionNumber,
  }: {
    workflowId: string;
    versionNumber: number;
  }) => await workflowApi.revertToVersion(workflowId, versionNumber),
);

// ========== Helpers ==========
function pushHistory(state: WorkflowState) {
  const entry: HistoryEntry = {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges)),
  };

  // Remove any future history entries (happens after undo + new action)
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);

  // Keep within max
  if (newHistory.length > state.maxHistory) {
    newHistory.shift();
  }

  state.history = newHistory;
  state.historyIndex = newHistory.length - 1;
  state.isDirty = true;
}

function parseGraphData(graphData: string): {
  nodes: Node<NodeData>[];
  edges: Edge[];
} {
  try {
    const parsed = JSON.parse(graphData);
    return {
      nodes: (parsed.nodes || []).map((n: Node<NodeData>) => ({
        ...n,
        type: n.type || "action",
      })),
      edges: parsed.edges || [],
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

// ========== Slice ==========
const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    setNodes(state, action: PayloadAction<Node<NodeData>[]>) {
      state.nodes = action.payload;
      state.isDirty = true;
    },
    setEdges(state, action: PayloadAction<Edge[]>) {
      state.edges = action.payload;
      state.isDirty = true;
    },
    updateNodeData(
      state,
      action: PayloadAction<{ nodeId: string; data: Partial<NodeData> }>,
    ) {
      const node = state.nodes.find((n) => n.id === action.payload.nodeId);
      if (node) {
        node.data = { ...node.data, ...action.payload.data };
        pushHistory(state);
      }
    },
    addNode(
      state,
      action: PayloadAction<{
        type: NodeType;
        position: { x: number; y: number };
        data?: Partial<NodeData>;
      }>,
    ) {
      const { type, position, data } = action.payload;
      const defaultLabels: Record<NodeType, string> = {
        [NodeType.Trigger]: "New Trigger",
        [NodeType.Action]: "New Action",
        [NodeType.Condition]: "New Condition",
        [NodeType.Delay]: "New Delay",
      };

      const newNode: Node<NodeData> = {
        id: `${type}-${uuidv4().slice(0, 8)}`,
        type,
        position,
        data: {
          label: data?.label || defaultLabels[type],
          description: data?.description || "",
          config: data?.config || {},
          ...data,
        },
      };

      state.nodes.push(newNode);
      pushHistory(state);
    },
    removeNode(state, action: PayloadAction<string>) {
      state.nodes = state.nodes.filter((n) => n.id !== action.payload);
      state.edges = state.edges.filter(
        (e) => e.source !== action.payload && e.target !== action.payload,
      );
      pushHistory(state);
    },
    addEdge(state, action: PayloadAction<Edge>) {
      const exists = state.edges.find(
        (e) =>
          e.source === action.payload.source &&
          e.target === action.payload.target &&
          e.sourceHandle === action.payload.sourceHandle,
      );
      if (!exists) {
        state.edges.push(action.payload);
        pushHistory(state);
      }
    },
    removeEdge(state, action: PayloadAction<string>) {
      state.edges = state.edges.filter((e) => e.id !== action.payload);
      pushHistory(state);
    },
    recordHistory(state) {
      pushHistory(state);
    },
    undo(state) {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        const entry = state.history[state.historyIndex];
        state.nodes = JSON.parse(JSON.stringify(entry.nodes));
        state.edges = JSON.parse(JSON.stringify(entry.edges));
        state.isDirty = true;
      }
    },
    redo(state) {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        const entry = state.history[state.historyIndex];
        state.nodes = JSON.parse(JSON.stringify(entry.nodes));
        state.edges = JSON.parse(JSON.stringify(entry.edges));
        state.isDirty = true;
      }
    },
    clearDirty(state) {
      state.isDirty = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all workflows
    builder.addCase(fetchWorkflows.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkflows.fulfilled, (state, action) => {
      state.loading = false;
      state.workflows = action.payload;
    });
    builder.addCase(fetchWorkflows.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch workflows";
    });

    // Fetch single workflow
    builder.addCase(fetchWorkflow.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkflow.fulfilled, (state, action) => {
      state.loading = false;
      state.currentWorkflow = action.payload;
      const { nodes, edges } = parseGraphData(action.payload.graphData);
      state.nodes = nodes;
      state.edges = edges;
      state.history = [
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
      ];
      state.historyIndex = 0;
      state.isDirty = false;
    });
    builder.addCase(fetchWorkflow.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch workflow";
    });

    // Create workflow
    builder.addCase(createWorkflow.fulfilled, (state, action) => {
      state.workflows.unshift({
        id: action.payload.id,
        name: action.payload.name,
        description: action.payload.description,
        status: action.payload.status,
        version: action.payload.version,
        createdAt: action.payload.createdAt,
        updatedAt: action.payload.updatedAt,
      });
    });

    // Save workflow
    builder.addCase(saveWorkflow.fulfilled, (state, action) => {
      state.currentWorkflow = action.payload;
      state.isDirty = false;
    });

    // Delete workflow
    builder.addCase(deleteWorkflow.fulfilled, (state, action) => {
      state.workflows = state.workflows.filter((w) => w.id !== action.payload);
      if (state.currentWorkflow?.id === action.payload) {
        state.currentWorkflow = null;
        state.nodes = [];
        state.edges = [];
      }
    });

    // Fetch versions
    builder.addCase(fetchVersions.fulfilled, (state, action) => {
      state.versions = action.payload;
    });

    // Revert to version
    builder.addCase(revertToVersion.fulfilled, (state, action) => {
      state.currentWorkflow = action.payload;
      const { nodes, edges } = parseGraphData(action.payload.graphData);
      state.nodes = nodes;
      state.edges = edges;
      pushHistory(state);
    });
  },
});

export const {
  setNodes,
  setEdges,
  updateNodeData,
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  recordHistory,
  undo,
  redo,
  clearDirty,
  clearError,
} = workflowSlice.actions;

export default workflowSlice.reducer;
