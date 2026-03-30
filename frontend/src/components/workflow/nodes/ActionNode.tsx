"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import { NodeData, ExecutionStatus } from "@/lib/types";

function ActionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  const statusColors: Record<string, string> = {
    [ExecutionStatus.Completed]: "ring-green-500 bg-green-500/10",
    [ExecutionStatus.Failed]: "ring-red-500 bg-red-500/10",
    [ExecutionStatus.Running]: "ring-yellow-500 bg-yellow-500/10 animate-pulse",
    [ExecutionStatus.Pending]: "ring-gray-500 bg-gray-500/10",
  };

  const statusClass = nodeData.executionStatus
    ? statusColors[nodeData.executionStatus] || ""
    : "";

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 min-w-[180px] shadow-lg
        transition-all duration-200 cursor-pointer
        ${
          selected
            ? "border-blue-400 shadow-blue-400/25"
            : "border-blue-600 hover:border-blue-400"
        }
        bg-gradient-to-br from-gray-900 to-gray-800
        ${statusClass ? `ring-2 ${statusClass}` : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-gray-900"
      />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
          <Play className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-400 uppercase tracking-wider">
            Action
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {nodeData.label}
          </div>
        </div>
      </div>
      {nodeData.description && (
        <div className="text-xs text-gray-400 mt-1 truncate">
          {nodeData.description}
        </div>
      )}
      {nodeData.config?.url && (
        <div className="text-[10px] text-blue-300/60 mt-1 truncate font-mono">
          {nodeData.config.method || "GET"} {nodeData.config.url}
        </div>
      )}
      {nodeData.errorMessage && (
        <div className="text-[10px] text-red-400 mt-1 truncate">
          ⚠ {nodeData.errorMessage}
        </div>
      )}
      {nodeData.executionTimeMs !== undefined && (
        <div className="text-[10px] text-gray-500 mt-1">
          {nodeData.executionTimeMs}ms
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-gray-900"
      />
    </div>
  );
}

export default memo(ActionNode);
