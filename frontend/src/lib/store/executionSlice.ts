import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { executionApi } from "../api/client";
import {
  WorkflowExecution,
  ExecutionStatus,
  NodeExecutionResult,
} from "../types";

interface ExecutionState {
  currentExecution: WorkflowExecution | null;
  executionHistory: WorkflowExecution[];
  isRunning: boolean;
  isSimulating: boolean;
  activeNodeId: string | null;
  stepIndex: number;
  autoPlaySpeed: number; // ms between steps
  autoPlaying: boolean;
  error: string | null;
}

const initialState: ExecutionState = {
  currentExecution: null,
  executionHistory: [],
  isRunning: false,
  isSimulating: false,
  activeNodeId: null,
  stepIndex: -1,
  autoPlaySpeed: 1000,
  autoPlaying: false,
  error: null,
};

export const executeWorkflow = createAsyncThunk(
  "execution/execute",
  async ({
    workflowId,
    inputData,
  }: {
    workflowId: string;
    inputData?: string;
  }) => await executionApi.execute(workflowId, inputData),
);

export const simulateWorkflow = createAsyncThunk(
  "execution/simulate",
  async ({
    workflowId,
    inputData,
  }: {
    workflowId: string;
    inputData?: string;
  }) => await executionApi.simulate(workflowId, inputData),
);

export const fetchExecutionHistory = createAsyncThunk(
  "execution/fetchHistory",
  async (workflowId: string) =>
    await executionApi.getWorkflowExecutions(workflowId),
);

const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    setActiveNode(state, action: PayloadAction<string | null>) {
      state.activeNodeId = action.payload;
    },
    setStepIndex(state, action: PayloadAction<number>) {
      state.stepIndex = action.payload;
      if (state.currentExecution && action.payload >= 0) {
        const result = state.currentExecution.nodeResults[action.payload];
        if (result) {
          state.activeNodeId = result.nodeId;
        }
      }
    },
    nextStep(state) {
      if (state.currentExecution) {
        const maxIndex = state.currentExecution.nodeResults.length - 1;
        if (state.stepIndex < maxIndex) {
          state.stepIndex++;
          state.activeNodeId =
            state.currentExecution.nodeResults[state.stepIndex].nodeId;
        } else {
          state.autoPlaying = false;
        }
      }
    },
    previousStep(state) {
      if (state.stepIndex > 0) {
        state.stepIndex--;
        if (state.currentExecution) {
          state.activeNodeId =
            state.currentExecution.nodeResults[state.stepIndex].nodeId;
        }
      }
    },
    setAutoPlaySpeed(state, action: PayloadAction<number>) {
      state.autoPlaySpeed = action.payload;
    },
    toggleAutoPlay(state) {
      state.autoPlaying = !state.autoPlaying;
    },
    stopAutoPlay(state) {
      state.autoPlaying = false;
    },
    clearExecution(state) {
      state.currentExecution = null;
      state.activeNodeId = null;
      state.stepIndex = -1;
      state.autoPlaying = false;
      state.isRunning = false;
      state.isSimulating = false;
    },
    clearExecutionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Execute
    builder.addCase(executeWorkflow.pending, (state) => {
      state.isRunning = true;
      state.error = null;
      state.activeNodeId = null;
      state.stepIndex = -1;
    });
    builder.addCase(executeWorkflow.fulfilled, (state, action) => {
      state.isRunning = false;
      state.currentExecution = action.payload;
      if (action.payload.nodeResults.length > 0) {
        state.stepIndex = action.payload.nodeResults.length - 1;
        state.activeNodeId = action.payload.nodeResults[state.stepIndex].nodeId;
      }
    });
    builder.addCase(executeWorkflow.rejected, (state, action) => {
      state.isRunning = false;
      state.error = action.error.message || "Execution failed";
    });

    // Simulate
    builder.addCase(simulateWorkflow.pending, (state) => {
      state.isSimulating = true;
      state.error = null;
      state.activeNodeId = null;
      state.stepIndex = -1;
    });
    builder.addCase(simulateWorkflow.fulfilled, (state, action) => {
      state.isSimulating = false;
      state.currentExecution = action.payload;
      if (action.payload.nodeResults.length > 0) {
        state.stepIndex = 0;
        state.activeNodeId = action.payload.nodeResults[0].nodeId;
      }
    });
    builder.addCase(simulateWorkflow.rejected, (state, action) => {
      state.isSimulating = false;
      state.error = action.error.message || "Simulation failed";
    });

    // History
    builder.addCase(fetchExecutionHistory.fulfilled, (state, action) => {
      state.executionHistory = action.payload;
    });
  },
});

export const {
  setActiveNode,
  setStepIndex,
  nextStep,
  previousStep,
  setAutoPlaySpeed,
  toggleAutoPlay,
  stopAutoPlay,
  clearExecution,
  clearExecutionError,
} = executionSlice.actions;

export default executionSlice.reducer;
