"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useRef } from "react";
import type { DragEvent } from "react";

import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { useTemplates } from "@/components/editor/templates-provider";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  CANVAS_SHAPE_DRAG_TYPE,
  DEFAULT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { CanvasControlBar } from "./canvas-control-bar";
import { CanvasEdgeRenderer } from "./canvas-edge";
import { CanvasNodeRenderer } from "./canvas-node";
import { ShapePanel } from "./shape-panel";

const nodeTypes: NodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeRenderer };
const edgeTypes: EdgeTypes = { [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer };

const defaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 12,
    height: 12,
    color: "#808090",
  },
  style: {
    strokeWidth: 1.5,
    stroke: "#808090",
    strokeLinecap: "round" as const,
  },
};

function FlowCanvasInner() {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition, fitView } = reactFlow;
  const nodeCounter = useRef(0);
  const templates = useTemplates();

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo });

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData(CANVAS_SHAPE_DRAG_TYPE);
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      nodeCounter.current += 1;
      const newNode: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeCounter.current}`,
        type: CANVAS_NODE_TYPE,
        position,
        data: { label: "", color: DEFAULT_NODE_COLOR, shape: payload.shape },
        style: { width: payload.width, height: payload.height },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange],
  );

  const onImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      // Replace the current canvas: remove every existing edge and node, then
      // add the template's. Everything flows through the same change handlers
      // that back `useLiveblocksFlow`, so the swap stays on the collaborative
      // sync path. Clone the static template data so the shared module arrays
      // are never mutated by downstream React Flow / Liveblocks updates.
      const templateNodes: CanvasNode[] = template.nodes.map((node) => ({
        ...node,
        position: { ...node.position },
        data: { ...node.data },
        style: { ...node.style },
      }));
      const templateEdges: CanvasEdge[] = template.edges.map((edge) => ({
        ...edge,
        data: { ...edge.data },
      }));

      // Remove edges first to avoid dangling references to removed nodes.
      onEdgesChange(edges.map((edge) => ({ type: "remove", id: edge.id })));
      onNodesChange(nodes.map((node) => ({ type: "remove", id: node.id })));

      onNodesChange(templateNodes.map((node) => ({ type: "add", item: node })));
      onEdgesChange(templateEdges.map((edge) => ({ type: "add", item: edge })));

      // Fit the view once React Flow has applied the new nodes.
      window.requestAnimationFrame(() => {
        void fitView({ duration: 300, padding: 0.2 });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, fitView],
  );

  return (
    <div
      className="relative h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          bgColor="#080809"
          color="#2a2a30"
        />
        <MiniMap
          pannable
          zoomable
          bgColor="#111114"
          maskColor="rgba(8, 8, 9, 0.6)"
          nodeColor="#2a2a30"
          nodeStrokeColor="#3a3a42"
        />
      </ReactFlow>
      <CanvasControlBar
        reactFlow={reactFlow}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ShapePanel />
      {templates ? (
        <StarterTemplatesModal
          isOpen={templates.isOpen}
          onClose={templates.close}
          onImport={onImportTemplate}
        />
      ) : null}
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
