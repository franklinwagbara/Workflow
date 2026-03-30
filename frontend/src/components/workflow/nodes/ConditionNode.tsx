"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { NodeData, ExecutionStatus } from "@/lib/types";

function ConditionNode({ data, selected }: NodeProps) {
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
        px-4 py-3 rounded-xl border-2 min-w-[200px] shadow-lg
        transition-all duration-200 cursor-pointer
        ${
          selected
            ? "border-amber-400 shadow-amber-400/25"
            : "border-amber-600 hover:border-amber-400"
        }
        bg-gradient-to-br from-gray-900 to-gray-800
        ${statusClass ? `ring-2 ${statusClass}` : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-gray-900"
      />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">
            Condition
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {nodeData.label}
          </div>
        </div>
      </div>
      {nodeData.config?.conditionExpression && (
        <div className="text-[10px] text-amber-300/60 mt-1 truncate font-mono bg-gray-800/50 rounded px-2 py-1">
          {nodeData.config.conditionExpression}
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
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-green-400">
          {nodeData.config?.trueLabel || "True"}
        </span>
        <span className="text-[10px] text-red-400">
          {nodeData.config?.falseLabel || "False"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "30%" }}
        className="!w-3 !h-3 !bg-green-400 !border-2 !border-gray-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "70%" }}
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-gray-900"
      />
    </div>
  );
}

export default memo(ConditionNode);
