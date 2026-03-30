"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Zap,
  Play,
  GitBranch,
  Clock,
  Globe,
  Code,
  Tag,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { updateNodeData } from "@/lib/store/workflowSlice";
import { setSelectedNode, closeSidePanel } from "@/lib/store/uiSlice";
import { NodeType } from "@/lib/types";

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function NodeConfigPanel() {
  const dispatch = useAppDispatch();
  const { selectedNodeId } = useAppSelector((state) => state.ui);
  const { nodes } = useAppSelector((state) => state.workflow);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeData = selectedNode?.data;

  // Local form state
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");
  const [conditionExpression, setConditionExpression] = useState("");
  const [conditionField, setConditionField] = useState("");
  const [conditionOperator, setConditionOperator] = useState("equals");
  const [conditionValue, setConditionValue] = useState("");
  const [delayMs, setDelayMs] = useState(1000);
  const [triggerType, setTriggerType] = useState("manual");

  // Sync local state when node changes
  useEffect(() => {
    if (!nodeData) return;
    setLabel(nodeData.label || "");
    setDescription(nodeData.description || "");

    const config = nodeData.config;
    if (config) {
      setUrl(config.url || "");
      setMethod(config.method || "GET");
      setHeaders(config.headers ? JSON.stringify(config.headers, null, 2) : "");
      setBody(config.body || "");
      setConditionExpression(config.conditionExpression || "");
      setConditionField(config.conditionField || "");
      setConditionOperator(config.conditionOperator || "equals");
      setConditionValue(config.conditionValue || "");
      setDelayMs(config.delayMs || 1000);
      setTriggerType(config.triggerType || "manual");
    }
  }, [nodeData, selectedNodeId]);

  const handleUpdate = useCallback(() => {
    if (!selectedNodeId || !nodeData) return;

    let parsedHeaders: Record<string, string> = {};
    try {
      if (headers.trim()) {
        parsedHeaders = JSON.parse(headers);
      }
    } catch {
      // Keep as empty if invalid JSON
    }

    dispatch(
      updateNodeData({
        nodeId: selectedNodeId,
        data: {
          ...nodeData,
          label,
          description,
          config: {
            ...nodeData.config,
            url,
            method,
            headers: parsedHeaders,
            body,
            conditionExpression,
            conditionField,
            conditionOperator,
            conditionValue,
            delayMs,
            triggerType,
          },
        },
      }),
    );
  }, [
    dispatch,
    selectedNodeId,
    nodeData,
    label,
    description,
    url,
    method,
    headers,
    body,
    conditionExpression,
    conditionField,
    conditionOperator,
    conditionValue,
    delayMs,
    triggerType,
  ]);

  // Auto-save on changes with debounce
  useEffect(() => {
    const timer = setTimeout(handleUpdate, 300);
    return () => clearTimeout(timer);
  }, [handleUpdate]);

  const handleClose = () => {
    dispatch(setSelectedNode(null));
    dispatch(closeSidePanel());
  };

  if (!selectedNode || !nodeData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-6">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a node to configure</p>
        </div>
      </div>
    );
  }

  const nodeType = (selectedNode.type || "") as NodeType;
  const nodeIcons: Record<string, typeof Zap> = {
    [NodeType.Trigger]: Zap,
    [NodeType.Action]: Play,
    [NodeType.Condition]: GitBranch,
    [NodeType.Delay]: Clock,
  };
  const nodeColors: Record<string, string> = {
    [NodeType.Trigger]: "text-emerald-400",
    [NodeType.Action]: "text-blue-400",
    [NodeType.Condition]: "text-amber-400",
    [NodeType.Delay]: "text-purple-400",
  };
  const Icon = nodeIcons[nodeType] || Zap;

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${nodeColors[nodeType]}`} />
          <span className="font-semibold text-white text-sm">
            Configure {nodeType}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common Fields */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            <Tag className="w-3 h-3 inline mr-1" />
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Node label..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            <FileText className="w-3 h-3 inline mr-1" />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            placeholder="Describe what this node does..."
          />
        </div>

        {/* Trigger-specific fields */}
        {nodeType === NodeType.Trigger && (
          <div className="space-y-3 pt-2 border-t border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Trigger Config
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="manual">Manual</option>
                <option value="webhook">Webhook</option>
                <option value="schedule">Schedule (Cron)</option>
                <option value="event">Event-based</option>
              </select>
            </div>
          </div>
        )}

        {/* Action-specific fields */}
        {nodeType === NodeType.Action && (
          <div className="space-y-3 pt-2 border-t border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              HTTP Request
            </h3>
            <div className="flex gap-2">
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {httpMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  <Globe className="w-3 h-3 inline mr-1" />
                  URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://api.example.com/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                <Code className="w-3 h-3 inline mr-1" />
                Headers (JSON)
              </label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                <Code className="w-3 h-3 inline mr-1" />
                Request Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder='{"key": "value"}'
              />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-xs text-gray-500">
                💡 Use{" "}
                <code className="text-indigo-400">{"{{nodeId.field}}"}</code> to
                reference output from previous nodes.
              </p>
            </div>
          </div>
        )}

        {/* Condition-specific fields */}
        {nodeType === NodeType.Condition && (
          <div className="space-y-3 pt-2 border-t border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Condition Logic
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Field to evaluate
              </label>
              <input
                type="text"
                value={conditionField}
                onChange={(e) => setConditionField(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. {{prev_node.status}}"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Operator
              </label>
              <select
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Compare Value
              </label>
              <input
                type="text"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Expected value..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Expression (Advanced)
              </label>
              <textarea
                value={conditionExpression}
                onChange={(e) => setConditionExpression(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="{{node1.statusCode}} == 200"
              />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-xs text-gray-500">
                True branch →{" "}
                <span className="text-green-400">green handle</span> | False
                branch → <span className="text-red-400">red handle</span>
              </p>
            </div>
          </div>
        )}

        {/* Delay-specific fields */}
        {nodeType === NodeType.Delay && (
          <div className="space-y-3 pt-2 border-t border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Delay Config
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Delay Duration (ms)
              </label>
              <input
                type="number"
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {delayMs >= 1000
                  ? `${(delayMs / 1000).toFixed(1)}s`
                  : `${delayMs}ms`}
                {delayMs >= 60000 && ` (${(delayMs / 60000).toFixed(1)} min)`}
              </p>
            </div>
          </div>
        )}

        {/* Node ID display */}
        <div className="pt-2 border-t border-gray-700">
          <p className="text-[10px] text-gray-600 font-mono">
            ID: {selectedNode.id}
          </p>
        </div>
      </div>
    </div>
  );
}
