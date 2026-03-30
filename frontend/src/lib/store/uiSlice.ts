import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum SidePanelType {
  None = "none",
  NodeConfig = "config",
  Execution = "execution",
  Versions = "versions",
  Schedules = "schedules",
}

interface UiState {
  selectedNodeId: string | null;
  sidePanel: SidePanelType;
  showMinimap: boolean;
  snapToGrid: boolean;
  gridSize: number;
  theme: "light" | "dark";
  createDialogOpen: boolean;
}

const initialState: UiState = {
  selectedNodeId: null,
  sidePanel: SidePanelType.None,
  showMinimap: true,
  snapToGrid: true,
  gridSize: 20,
  theme: "dark",
  createDialogOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSelectedNode(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
      if (action.payload) {
        state.sidePanel = SidePanelType.NodeConfig;
      }
    },
    setSidePanel(state, action: PayloadAction<SidePanelType>) {
      state.sidePanel = action.payload;
    },
    closeSidePanel(state) {
      state.sidePanel = SidePanelType.None;
    },
    toggleMinimap(state) {
      state.showMinimap = !state.showMinimap;
    },
    toggleSnapToGrid(state) {
      state.snapToGrid = !state.snapToGrid;
    },
    setGridSize(state, action: PayloadAction<number>) {
      state.gridSize = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setCreateDialogOpen(state, action: PayloadAction<boolean>) {
      state.createDialogOpen = action.payload;
    },
  },
});

export const {
  setSelectedNode,
  setSidePanel,
  closeSidePanel,
  toggleMinimap,
  toggleSnapToGrid,
  setGridSize,
  toggleTheme,
  setCreateDialogOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
