"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings2,
  Activity,
  History,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchWorkflow } from "@/lib/store/workflowSlice";
import { fetchExecutionHistory } from "@/lib/store/executionSlice";
import {
  setSidePanel,
  closeSidePanel,
  SidePanelType,
} from "@/lib/store/uiSlice";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import NodeConfigPanel from "@/components/panels/NodeConfigPanel";
import ExecutionPanel from "@/components/execution/ExecutionPanel";
import VersionsPanel from "@/components/panels/VersionsPanel";
import SchedulesPanel from "@/components/panels/SchedulesPanel";

const panelButtons = [
  { panel: SidePanelType.NodeConfig, icon: Settings2, label: "Config" },
  { panel: SidePanelType.Execution, icon: Activity, label: "Execute" },
  { panel: SidePanelType.Versions, icon: History, label: "Versions" },
  { panel: SidePanelType.Schedules, icon: Calendar, label: "Schedule" },
];

const panelComponents: Record<string, React.FC> = {
  [SidePanelType.NodeConfig]: NodeConfigPanel,
  [SidePanelType.Execution]: ExecutionPanel,
  [SidePanelType.Versions]: VersionsPanel,
  [SidePanelType.Schedules]: SchedulesPanel,
};

export default function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    currentWorkflow,
    loading: isLoading,
    error,
    isDirty,
  } = useAppSelector((state) => state.workflow);
  const { sidePanel } = useAppSelector((state) => state.ui);

  useEffect(() => {
    dispatch(fetchWorkflow(id));
    dispatch(fetchExecutionHistory(id));
  }, [dispatch, id]);

  const togglePanel = (panel: SidePanelType) => {
    if (sidePanel === panel) {
      dispatch(closeSidePanel());
    } else {
      dispatch(setSidePanel(panel));
    }
  };

  const PanelComponent = sidePanel ? panelComponents[sidePanel] : null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-800 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Toolbar */}
      <div className="h-10 bg-gray-900/80 border-b border-gray-800 flex items-center px-3 gap-2 shrink-0">
        <button
          onClick={() => router.push("/")}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-800" />
        <span className="text-sm font-medium text-white truncate max-w-[200px]">
          {currentWorkflow?.name || "Untitled"}
        </span>
        {isDirty && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-yellow-500/20 text-yellow-400">
            Unsaved
          </span>
        )}
        <span className="text-[10px] text-gray-600">
          v{currentWorkflow?.version || 1}
        </span>
        <div className="flex-1" />
        {/* Panel toggle buttons */}
        {panelButtons.map(({ panel, icon: Icon, label }) => (
          <button
            key={panel}
            onClick={() => togglePanel(panel)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sidePanel === panel
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas />
        </div>

        {/* Side Panel */}
        {PanelComponent && (
          <div className="w-[340px] shrink-0 overflow-hidden">
            <PanelComponent />
          </div>
        )}
      </div>
    </div>
  );
}
