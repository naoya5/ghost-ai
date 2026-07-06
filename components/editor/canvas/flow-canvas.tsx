"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, MouseEvent as ReactMouseEvent } from "react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { useAiSidebar } from "@/components/editor/ai-sidebar-provider";
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
  useEdges,
  useNodes,
  useReactFlow,
  type EdgeTypes,
  type IsValidConnection,
  type NodeTypes,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useRoom,
  useUndo,
  useUpdateMyPresence,
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
import { useCanvasAutosave } from "@/hooks/useCanvasAutosave";

import { CanvasControlBar } from "./canvas-control-bar";
import { CanvasDeleteProvider } from "./canvas-delete-context";
import { useCanvasSave } from "./canvas-save-context";
import { CanvasEdgeRenderer } from "./canvas-edge";
import { CanvasNodeRenderer } from "./canvas-node";
import { AiActivityLayer } from "./ai-activity-layer";
import { CanvasSaveButton } from "./canvas-save-button";
import { LiveCursors } from "./live-cursors";
import { PresenceAvatars } from "./presence-avatars";
import { ShapePanel } from "./shape-panel";

const nodeTypes: NodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeRenderer };
const edgeTypes: EdgeTypes = { [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer };

const isValidCanvasConnection: IsValidConnection<CanvasEdge> = (connection) =>
  connection.source !== connection.target;

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
  const aiSidebar = useAiSidebar();
  const room = useRoom();
  const projectId = room.id;

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  // Load the saved canvas from Vercel Blob when the room is empty, then start
  // autosaving. If the room already has active nodes or edges we skip the load
  // entirely to avoid overwriting live collaboration — autosave can start right
  // away (the initial enabled value is derived from the mount snapshot).
  const [autosaveEnabled, setAutosaveEnabled] = useState(
    () => nodes.length > 0 || edges.length > 0,
  );
  const loadRan = useRef(false);

  useEffect(() => {
    if (loadRan.current) return;
    loadRan.current = true;

    // Fit the viewport to the initial canvas content once React Flow has it.
    // This runs only for the load path (opening a saved/populated canvas) — it
    // must never fire on a drop, otherwise the viewport jumps. See below: the
    // `fitView` prop is intentionally not set on <ReactFlow>.
    const fitToContent = () => {
      window.requestAnimationFrame(() => {
        void fitView({ padding: 0.2 });
      });
    };

    // Room already had content at mount — autosave is enabled via the initial
    // state, so there is nothing to load; just fit to what is already there.
    if (nodes.length > 0 || edges.length > 0) {
      fitToContent();
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);
        if (!cancelled && response.ok) {
          const data = (await response.json()) as {
            canvas: { nodes?: CanvasNode[]; edges?: CanvasEdge[] } | null;
          };
          const canvas = data.canvas;
          let loadedContent = false;
          if (canvas) {
            if (canvas.nodes?.length) {
              onNodesChange(
                canvas.nodes.map((node) => ({ type: "add", item: node })),
              );
              loadedContent = true;
            }
            if (canvas.edges?.length) {
              onEdgesChange(
                canvas.edges.map((edge) => ({ type: "add", item: edge })),
              );
              loadedContent = true;
            }
          }
          if (loadedContent) fitToContent();
        }
      } catch {
        // Ignore load failures — the editor still works with an empty canvas.
      } finally {
        if (!cancelled) setAutosaveEnabled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Run once on mount; nodes/edges are read from the initial synced state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status: saveStatus, save: saveCanvas } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: autosaveEnabled,
  });

  // Bridge the autosave hook to the workspace navbar's Save button: register the
  // manual save handler and mirror the autosave status up to the shared context.
  const { registerSave, unregisterSave, reportStatus } = useCanvasSave();
  useEffect(() => {
    registerSave(saveCanvas);
    return () => unregisterSave(saveCanvas);
  }, [saveCanvas, registerSave, unregisterSave]);
  useEffect(() => {
    reportStatus(saveStatus);
  }, [saveStatus, reportStatus]);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const updateMyPresence = useUpdateMyPresence();

  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo });

  // Broadcast the cursor in React Flow coordinates so other participants see it
  // pinned to the same canvas point regardless of their own pan/zoom.
  const onMouseMove = useCallback(
    (event: ReactMouseEvent) => {
      updateMyPresence({
        cursor: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Read the authoritative selection straight from the React Flow store so we
  // pick up `selected` regardless of what the collaborative sync mirrors back.
  const storeNodes = useNodes<CanvasNode>();
  const storeEdges = useEdges<CanvasEdge>();

  // Single routed deletion path. Removal must go through useLiveblocksFlow's
  // `onDelete` mutation, which actually deletes entries from the shared LiveMap
  // and syncs to every client. NOTE: `onNodesChange`/`onEdgesChange` treat a
  // `{ type: "remove" }` change as a no-op in @liveblocks/react-flow, so they
  // cannot be used to delete. React Flow's built-in delete key is disabled via
  // deleteKeyCode={null}; both the keyboard shortcut and the inline delete
  // buttons call this via context instead.
  const deleteElements = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      const removedNodeIds = new Set(nodeIds);
      const edgeIdsToRemove = new Set(edgeIds);

      // Cascade to any edge left dangling by a removed node — otherwise orphaned
      // edges would sync to every client. Mirrors React Flow's built-in cascade.
      for (const edge of storeEdges) {
        if (
          removedNodeIds.has(edge.source) ||
          removedNodeIds.has(edge.target)
        ) {
          edgeIdsToRemove.add(edge.id);
        }
      }

      const nodesToDelete = storeNodes.filter((node) =>
        removedNodeIds.has(node.id),
      );
      const edgesToDelete = storeEdges.filter((edge) =>
        edgeIdsToRemove.has(edge.id),
      );
      if (nodesToDelete.length === 0 && edgesToDelete.length === 0) return;

      onDelete({ nodes: nodesToDelete, edges: edgesToDelete });
    },
    [storeNodes, storeEdges, onDelete],
  );

  // Delete/Backspace removes the current selection. A window-level listener is
  // used (rather than an element handler) so it fires regardless of which part
  // of the canvas currently holds focus after a node/edge is selected.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;

      // Ignore when typing into a label editor or any editable field.
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const selectedNodeIds = storeNodes
        .filter((node) => node.selected)
        .map((node) => node.id);
      const selectedEdgeIds = storeEdges
        .filter((edge) => edge.selected)
        .map((edge) => edge.id);
      if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

      event.preventDefault();
      deleteElements(selectedNodeIds, selectedEdgeIds);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [storeNodes, storeEdges, deleteElements]);

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

      // Flow-space point under the cursor. screenToFlowPosition already accounts
      // for the container's bounding rect and the current pan/zoom. The drag
      // ghost is centered on the cursor (see ShapePanel), so offset by half the
      // node size to land the node's center — not its top-left — on the cursor.
      const cursor = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const position = {
        x: cursor.x - payload.width / 2,
        y: cursor.y - payload.height / 2,
      };

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
      // add the template's. Removal goes through onDelete and the adds through
      // the useLiveblocksFlow change handlers, so the swap stays on the
      // collaborative sync path. Clone the static template data so the shared
      // module arrays are never mutated by downstream React Flow / Liveblocks
      // updates.
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

      // Clear the current canvas via onDelete — `{ type: "remove" }` changes are
      // a no-op in @liveblocks/react-flow, so onNodesChange/onEdgesChange can't
      // remove. onDelete deletes edges and nodes from the shared LiveMap.
      if (nodes.length > 0 || edges.length > 0) {
        onDelete({ nodes, edges });
      }

      onNodesChange(templateNodes.map((node) => ({ type: "add", item: node })));
      onEdgesChange(templateEdges.map((edge) => ({ type: "add", item: edge })));

      // Fit the view once React Flow has applied the new nodes.
      window.requestAnimationFrame(() => {
        void fitView({ duration: 300, padding: 0.2 });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, onDelete, fitView],
  );

  return (
    <div
      className="relative h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CanvasDeleteProvider value={deleteElements}>
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
        connectionMode={ConnectionMode.Strict}
        isValidConnection={isValidCanvasConnection}
        // Nodes expose matching source/target handles on all four sides, so
        // keep radius snapping tight. A large radius can grab a nearby node's
        // handle and create edges on the wrong node.
        connectionRadius={20}
        colorMode="dark"
        // Deletion is handled manually via onKeyDown so it flows through the
        // Liveblocks collaborative helpers. Disable the built-in key handler.
        deleteKeyCode={null}
        // No `fitView` here: an automatic fit fires when the first node lands on
        // an empty canvas, jerking the viewport. Fit-on-load is done explicitly
        // in the load effect instead.
        proOptions={{ hideAttribution: true }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
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
        <LiveCursors />
        <AiActivityLayer />
      </ReactFlow>
      </CanvasDeleteProvider>
      <CanvasSaveButton status={saveStatus} />
      <PresenceAvatars />
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
      {aiSidebar ? (
        <AiSidebar
          isOpen={aiSidebar.isOpen}
          onClose={aiSidebar.close}
          projectId={projectId}
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
