"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  executeWorkflow,
  simulateWorkflow,
  nextStep,
  previousStep,
  setActiveNode,
  clearExecution,
  toggleAutoPlay,
  setAutoPlaySpeed,
} from "@/lib/store/executionSlice";
import { ExecutionStatus } from "@/lib/types";

const statusIcons: Record<string, typeof CheckCircle2> = {
  [ExecutionStatus.Completed]: CheckCircle2,
  [ExecutionStatus.Failed]: XCircle,
  [ExecutionStatus.Running]: Loader2,
  [ExecutionStatus.Pending]: Clock,
};

const statusColors: Record<string, string> = {
  [ExecutionStatus.Completed]: "text-green-400",
  [ExecutionStatus.Failed]: "text-red-400",
  [ExecutionStatus.Running]: "text-blue-400",
  [ExecutionStatus.Pending]: "text-gray-400",
};

export default function ExecutionPanel() {
  const dispatch = useAppDispatch();
  const {
    currentExecution,
    isRunning: isExecuting,
    isSimulating,
    executionHistory,
    stepIndex,
    autoPlaying: autoPlay,
    autoPlaySpeed,
  } = useAppSelector((state) => state.execution);
  const { currentWorkflow } = useAppSelector((state) => state.workflow);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (autoPlay && currentExecution?.nodeResults) {
      autoPlayRef.current = setInterval(() => {
        dispatch(nextStep());
      }, autoPlaySpeed);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, autoPlaySpeed, dispatch, currentExecution]);

  // Stop auto-play when we reach the end
  useEffect(() => {
    if (
      currentExecution?.nodeResults &&
      stepIndex >= currentExecution.nodeResults.length - 1 &&
      autoPlay
    ) {
      dispatch(toggleAutoPlay());
    }
  }, [stepIndex, currentExecution, autoPlay, dispatch]);

  const handleExecute = useCallback(() => {
    if (!currentWorkflow) return;
    dispatch(executeWorkflow({ workflowId: currentWorkflow.id }));
  }, [dispatch, currentWorkflow]);

  const handleSimulate = useCallback(() => {
    if (!currentWorkflow) return;
    dispatch(simulateWorkflow({ workflowId: currentWorkflow.id }));
  }, [dispatch, currentWorkflow]);

  const handleClear = useCallback(() => {
    dispatch(clearExecution());
    dispatch(setActiveNode(null));
  }, [dispatch]);

  const nodeResults = currentExecution?.nodeResults || [];
  const currentStep = nodeResults[stepIndex];

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white text-sm">Execution</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExecute}
            disabled={isExecuting || isSimulating || !currentWorkflow}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700
              disabled:bg-green-600/30 disabled:text-green-400/50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Execute
          </button>
          <button
            onClick={handleSimulate}
            disabled={isExecuting || isSimulating || !currentWorkflow}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700
              disabled:bg-indigo-600/30 disabled:text-indigo-400/50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isSimulating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Simulate
          </button>
        </div>
      </div>

      {/* Step Controls */}
      {currentExecution && nodeResults.length > 0 && (
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              Step {stepIndex + 1} of {nodeResults.length}
            </span>
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => dispatch(previousStep())}
              disabled={stepIndex <= 0}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white
                disabled:opacity-30 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => dispatch(toggleAutoPlay())}
              className={`p-1.5 rounded transition-colors ${
                autoPlay
                  ? "bg-indigo-600/30 text-indigo-400"
                  : "hover:bg-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {autoPlay ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => dispatch(nextStep())}
              disabled={stepIndex >= nodeResults.length - 1}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white
                disabled:opacity-30 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>

            {/* Speed control */}
            <div className="flex-1" />
            <select
              value={autoPlaySpeed}
              onChange={(e) =>
                dispatch(setAutoPlaySpeed(parseInt(e.target.value)))
              }
              className="bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 px-2 py-1"
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={3000}>3s</option>
            </select>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${((stepIndex + 1) / nodeResults.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Execution Status */}
      {currentExecution && (
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Status:</span>
            <span
              className={`font-medium ${
                statusColors[currentExecution.status] || "text-gray-400"
              }`}
            >
              {currentExecution.status}
            </span>
          </div>
          {currentExecution.startedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Started:{" "}
              {new Date(currentExecution.startedAt).toLocaleTimeString()}
            </p>
          )}
          {currentExecution.completedAt && (
            <p className="text-xs text-gray-500">
              Completed:{" "}
              {new Date(currentExecution.completedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Node Results List */}
      <div className="flex-1 overflow-y-auto">
        {nodeResults.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {nodeResults.map((result, idx) => {
              const StatusIcon = statusIcons[result.status] || Clock;
              const isActive = idx === stepIndex;
              return (
                <button
                  key={result.nodeId + idx}
                  onClick={() => {
                    dispatch(setActiveNode(result.nodeId));
                  }}
                  className={`w-full text-left p-3 transition-colors ${
                    isActive
                      ? "bg-indigo-600/10 border-l-2 border-indigo-500"
                      : "hover:bg-gray-800/50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={`w-4 h-4 ${statusColors[result.status]} ${
                        result.status === ExecutionStatus.Running
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    <span className="text-sm font-medium text-white truncate">
                      {result.nodeId}
                    </span>
                    {result.executionTimeMs !== undefined && (
                      <span className="text-[10px] text-gray-500 ml-auto">
                        {result.executionTimeMs}ms
                      </span>
                    )}
                  </div>
                  {isActive && result.outputData && (
                    <div className="mt-2 p-2 bg-gray-800 rounded text-xs font-mono text-gray-400 max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {typeof result.outputData === "string"
                          ? result.outputData
                          : JSON.stringify(result.outputData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {isActive && result.errorMessage && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-800/30 rounded text-xs text-red-400">
                      {result.errorMessage}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 p-6">
            <div className="text-center">
              <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Run or simulate to see results</p>
            </div>
          </div>
        )}
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div className="border-t border-gray-700 p-3">
          <details>
            <summary className="text-xs font-medium text-gray-400 cursor-pointer">
              History ({executionHistory.length})
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {executionHistory.slice(0, 10).map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      exec.status === ExecutionStatus.Completed
                        ? "bg-green-500"
                        : exec.status === ExecutionStatus.Failed
                          ? "bg-red-500"
                          : "bg-gray-500"
                    }`}
                  />
                  <span className="truncate">
                    {new Date(exec.startedAt).toLocaleString()}
                  </span>
                  <span className="ml-auto">{exec.status}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
