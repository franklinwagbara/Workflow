"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import { NodeData, ExecutionStatus } from "@/lib/types";

function TriggerNode({ data, selected }: NodeProps) {
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
            ? "border-emerald-400 shadow-emerald-400/25"
            : "border-emerald-600 hover:border-emerald-400"
        }
        bg-gradient-to-br from-gray-900 to-gray-800
        ${statusClass ? `ring-2 ${statusClass}` : ""}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            Trigger
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
      {nodeData.executionTimeMs !== undefined && (
        <div className="text-[10px] text-gray-500 mt-1">
          {nodeData.executionTimeMs}ms
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-gray-900"
      />
    </div>
  );
}

export default memo(TriggerNode);
