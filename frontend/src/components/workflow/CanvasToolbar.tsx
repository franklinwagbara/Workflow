"use client";

import { useCallback } from "react";
import {
  Zap,
  Play,
  GitBranch,
  Clock,
  Undo2,
  Redo2,
  Grid3X3,
  Map,
  Save,
  Download,
  Upload,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { undo, redo, saveWorkflow } from "@/lib/store/workflowSlice";
import { toggleSnapToGrid, toggleMinimap } from "@/lib/store/uiSlice";
import { NodeType } from "@/lib/types";

const nodeTypeConfig = [
  {
    type: NodeType.Trigger,
    icon: Zap,
    label: "Trigger",
    color: "text-emerald-400 bg-emerald-600/20 border-emerald-600",
  },
  {
    type: NodeType.Action,
    icon: Play,
    label: "Action",
    color: "text-blue-400 bg-blue-600/20 border-blue-600",
  },
  {
    type: NodeType.Condition,
    icon: GitBranch,
    label: "Condition",
    color: "text-amber-400 bg-amber-600/20 border-amber-600",
  },
  {
    type: NodeType.Delay,
    icon: Clock,
    label: "Delay",
    color: "text-purple-400 bg-purple-600/20 border-purple-600",
  },
];

export default function CanvasToolbar() {
  const dispatch = useAppDispatch();
  const { currentWorkflow, nodes, edges, isDirty, historyIndex, history } =
    useAppSelector((state) => state.workflow);
  const { snapToGrid, showMinimap } = useAppSelector((state) => state.ui);

  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: NodeType) => {
      event.dataTransfer.setData("application/flowforge-node", nodeType);
      event.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!currentWorkflow) return;
    const graphData = JSON.stringify({ nodes, edges });
    dispatch(
      saveWorkflow({
        id: currentWorkflow.id,
        graphData,
        changeDescription: "Manual save",
      }),
    );
  }, [dispatch, currentWorkflow, nodes, edges]);

  const handleExport = useCallback(() => {
    const graphData = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([graphData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentWorkflow?.name || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, currentWorkflow]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes && data.edges) {
            // Would dispatch to load imported data
            console.log("Imported:", data);
          }
        } catch (err) {
          console.error("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Node Palette */}
      <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl p-3 shadow-xl">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Nodes
        </div>
        <div className="flex gap-2">
          {nodeTypeConfig.map(({ type, icon: Icon, label, color }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-lg border cursor-grab
                active:cursor-grabbing transition-all hover:scale-105
                ${color}
              `}
              title={`Drag to add ${label} node`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl p-2 shadow-xl flex gap-1">
        <button
          onClick={() => dispatch(undo())}
          disabled={historyIndex <= 0}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => dispatch(redo())}
          disabled={historyIndex >= history.length - 1}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-700 mx-1" />
        <button
          onClick={() => dispatch(toggleSnapToGrid())}
          className={`p-2 rounded-lg transition-colors ${
            snapToGrid
              ? "bg-indigo-600/30 text-indigo-400"
              : "hover:bg-gray-700 text-gray-400"
          }`}
          title="Toggle snap to grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => dispatch(toggleMinimap())}
          className={`p-2 rounded-lg transition-colors ${
            showMinimap
              ? "bg-indigo-600/30 text-indigo-400"
              : "hover:bg-gray-700 text-gray-400"
          }`}
          title="Toggle minimap"
        >
          <Map className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-700 mx-1" />
        <button
          onClick={handleSave}
          disabled={!isDirty || !currentWorkflow}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          title="Save workflow (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={handleExport}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Export JSON"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleImport}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Import JSON"
        >
          <Upload className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
