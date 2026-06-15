"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useRef } from "react";
import type { DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";

import {
  CANVAS_NODE_TYPE,
  CANVAS_SHAPE_DRAG_TYPE,
  DEFAULT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas";

import { CanvasNodeRenderer } from "./canvas-node";
import { ShapePanel } from "./shape-panel";

const nodeTypes: NodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeRenderer };

function FlowCanvasInner() {
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();
  const nodeCounter = useRef(0);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

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
      <ShapePanel />
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
