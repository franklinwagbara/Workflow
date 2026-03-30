import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import workflowReducer from "./workflowSlice";
import executionReducer from "./executionSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    execution: executionReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization check
        ignoredActions: ["workflow/setNodes", "workflow/setEdges"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
