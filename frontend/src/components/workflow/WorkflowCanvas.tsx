"use client";

import { useCallback, useRef, useMemo, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  Connection,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  SelectionMode,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  setNodes,
  setEdges,
  addEdge as addEdgeAction,
  addNode,
  recordHistory,
  undo,
  redo,
} from "@/lib/store/workflowSlice";
import { setSelectedNode } from "@/lib/store/uiSlice";
import { NodeType, NodeData } from "@/lib/types";
import TriggerNode from "./nodes/TriggerNode";
import ActionNode from "./nodes/ActionNode";
import ConditionNode from "./nodes/ConditionNode";
import DelayNode from "./nodes/DelayNode";
import CanvasToolbar from "./CanvasToolbar";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};

const defaultEdgeOptions = {
  animated: false,
  style: { stroke: "#6366f1", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
};

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}

function WorkflowCanvasInner() {
  const dispatch = useAppDispatch();
  const { nodes, edges } = useAppSelector((state) => state.workflow);
  const { snapToGrid, gridSize, showMinimap } = useAppSelector(
    (state) => state.ui,
  );
  const { activeNodeId, currentExecution, stepIndex } = useAppSelector(
    (state) => state.execution,
  );
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Overlay execution state on nodes
  const displayNodes = useMemo(() => {
    if (!currentExecution || stepIndex < 0) return nodes;

    return nodes.map((node) => {
      const results = currentExecution.nodeResults.filter(
        (r) => r.nodeId === node.id,
      );
      const latestResult = results[results.length - 1];

      if (!latestResult) return node;

      const resultIndex = currentExecution.nodeResults.indexOf(latestResult);
      const isActive = node.id === activeNodeId;
      const isCompleted = resultIndex <= stepIndex;

      if (!isCompleted && !isActive) return node;

      return {
        ...node,
        data: {
          ...node.data,
          executionStatus: latestResult.status,
          executionTimeMs: latestResult.executionTimeMs,
          errorMessage: latestResult.errorMessage || undefined,
          executionOutput: (() => {
            try {
              return JSON.parse(latestResult.outputData);
            } catch {
              return {};
            }
          })(),
        } as NodeData,
      };
    });
  }, [nodes, currentExecution, stepIndex, activeNodeId]);

  // Animated edges during execution
  const displayEdges = useMemo(() => {
    if (!currentExecution || stepIndex < 0) return edges;

    const executedNodeIds = new Set(
      currentExecution.nodeResults.slice(0, stepIndex + 1).map((r) => r.nodeId),
    );

    return edges.map((edge) => {
      const isActive =
        executedNodeIds.has(edge.source) && executedNodeIds.has(edge.target);

      return {
        ...edge,
        animated: isActive,
        style: {
          ...edge.style,
          stroke: isActive ? "#22c55e" : "#6366f1",
          strokeWidth: isActive ? 3 : 2,
        },
      };
    });
  }, [edges, currentExecution, stepIndex]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(
        changes,
        nodes as any,
      ) as unknown as Node<NodeData>[];
      dispatch(setNodes(updated));
    },
    [dispatch, nodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges);
      dispatch(setEdges(updated));
    },
    [dispatch, edges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newEdge: Edge = {
          id: `e-${connection.source}-${connection.target}-${Date.now()}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
          ...defaultEdgeOptions,
        };
        dispatch(addEdgeAction(newEdge));
      }
    },
    [dispatch],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      dispatch(setSelectedNode(node.id));
    },
    [dispatch],
  );

  const onPaneClick = useCallback(() => {
    dispatch(setSelectedNode(null));
  }, [dispatch]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(
        "application/flowforge-node",
      ) as NodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      dispatch(addNode({ type, position }));
    },
    [dispatch, screenToFlowPosition],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodeDragStop = useCallback(() => {
    dispatch(recordHistory());
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch(redo());
        } else {
          dispatch(undo());
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        dispatch(redo());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        selectionMode={SelectionMode.Partial}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
        className="bg-gray-950"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={gridSize}
          size={1}
          color="#374151"
        />
        <Controls className="!bg-gray-800 !border-gray-700 !rounded-lg !shadow-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700" />
        {showMinimap && (
          <MiniMap
            className="!bg-gray-800 !border-gray-700 !rounded-lg"
            nodeColor={(node) => {
              switch (node.type) {
                case "trigger":
                  return "#10b981";
                case "action":
                  return "#3b82f6";
                case "condition":
                  return "#f59e0b";
                case "delay":
                  return "#a855f7";
                default:
                  return "#6b7280";
              }
            }}
            maskColor="rgba(0, 0, 0, 0.6)"
          />
        )}
        <Panel position="top-left">
          <CanvasToolbar />
        </Panel>
      </ReactFlow>
    </div>
  );
}
