import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  label: string,
  x: number,
  y: number,
  options: {
    color?: string;
    shape?: CanvasNode["data"]["shape"];
    width?: number;
    height?: number;
  } = {},
): CanvasNode {
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    data: {
      label,
      color: options.color ?? "#1F1F1F",
      shape: options.shape ?? "rectangle",
    },
    style: {
      width: options.width ?? 160,
      height: options.height ?? 80,
    },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
): CanvasEdge {
  return {
    id,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    data: label ? { label } : {},
  };
}

// ---------------------------------------------------------------------------
// Template 1 — Microservices architecture
// ---------------------------------------------------------------------------

const microservicesNodes: CanvasNode[] = [
  makeNode("ms-client", "Client App", 0, 80, {
    color: "#10233D",
    shape: "rectangle",
    width: 140,
    height: 70,
  }),
  makeNode("ms-gateway", "API Gateway", 220, 80, {
    color: "#2E1938",
    shape: "pill",
    width: 160,
    height: 64,
  }),
  makeNode("ms-auth", "Auth Service", 460, 0, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ms-users", "User Service", 460, 100, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ms-orders", "Order Service", 460, 200, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ms-db-users", "Users DB", 700, 100, {
    color: "#062822",
    shape: "cylinder",
    width: 120,
    height: 100,
  }),
  makeNode("ms-db-orders", "Orders DB", 700, 220, {
    color: "#062822",
    shape: "cylinder",
    width: 120,
    height: 100,
  }),
  makeNode("ms-queue", "Message Queue", 460, 330, {
    color: "#331B00",
    shape: "hexagon",
    width: 150,
    height: 100,
  }),
];

const microservicesEdges: CanvasEdge[] = [
  makeEdge("ms-e1", "ms-client", "ms-gateway", "HTTP"),
  makeEdge("ms-e2", "ms-gateway", "ms-auth", "Verify"),
  makeEdge("ms-e3", "ms-gateway", "ms-users", "REST"),
  makeEdge("ms-e4", "ms-gateway", "ms-orders", "REST"),
  makeEdge("ms-e5", "ms-users", "ms-db-users"),
  makeEdge("ms-e6", "ms-orders", "ms-db-orders"),
  makeEdge("ms-e7", "ms-orders", "ms-queue", "Publish"),
];

// ---------------------------------------------------------------------------
// Template 2 — CI/CD pipeline
// ---------------------------------------------------------------------------

const cicdNodes: CanvasNode[] = [
  makeNode("ci-code", "Source Code", 0, 100, {
    color: "#10233D",
    shape: "rectangle",
    width: 140,
    height: 70,
  }),
  makeNode("ci-trigger", "Push / PR", 200, 100, {
    color: "#2E1938",
    shape: "diamond",
    width: 130,
    height: 110,
  }),
  makeNode("ci-build", "Build", 390, 60, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 130,
    height: 70,
  }),
  makeNode("ci-test", "Test", 390, 160, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 130,
    height: 70,
  }),
  makeNode("ci-lint", "Lint & Type\nCheck", 390, 260, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 130,
    height: 70,
  }),
  makeNode("ci-gate", "Quality Gate", 580, 160, {
    color: "#331B00",
    shape: "diamond",
    width: 130,
    height: 110,
  }),
  makeNode("ci-staging", "Staging Deploy", 780, 100, {
    color: "#3A1726",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ci-prod", "Prod Deploy", 980, 100, {
    color: "#3C1618",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ci-monitor", "Monitor", 980, 200, {
    color: "#062822",
    shape: "circle",
    width: 100,
    height: 100,
  }),
];

const cicdEdges: CanvasEdge[] = [
  makeEdge("ci-e1", "ci-code", "ci-trigger"),
  makeEdge("ci-e2", "ci-trigger", "ci-build"),
  makeEdge("ci-e3", "ci-trigger", "ci-test"),
  makeEdge("ci-e4", "ci-trigger", "ci-lint"),
  makeEdge("ci-e5", "ci-build", "ci-gate"),
  makeEdge("ci-e6", "ci-test", "ci-gate"),
  makeEdge("ci-e7", "ci-lint", "ci-gate"),
  makeEdge("ci-e8", "ci-gate", "ci-staging", "Pass"),
  makeEdge("ci-e9", "ci-staging", "ci-prod", "Approve"),
  makeEdge("ci-e10", "ci-prod", "ci-monitor"),
];

// ---------------------------------------------------------------------------
// Template 3 — Event-driven system
// ---------------------------------------------------------------------------

const eventDrivenNodes: CanvasNode[] = [
  makeNode("ev-producer1", "Order Service", 0, 40, {
    color: "#10233D",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ev-producer2", "Inventory\nService", 0, 160, {
    color: "#10233D",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ev-producer3", "Payment\nService", 0, 280, {
    color: "#10233D",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ev-broker", "Event Broker", 250, 160, {
    color: "#331B00",
    shape: "hexagon",
    width: 160,
    height: 120,
  }),
  makeNode("ev-consumer1", "Notification\nService", 480, 40, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ev-consumer2", "Analytics\nService", 480, 160, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ev-consumer3", "Audit Log", 480, 280, {
    color: "#0F2E18",
    shape: "rectangle",
    width: 150,
    height: 70,
  }),
  makeNode("ev-store", "Event Store", 480, 380, {
    color: "#062822",
    shape: "cylinder",
    width: 130,
    height: 100,
  }),
  makeNode("ev-dlq", "Dead Letter\nQueue", 250, 340, {
    color: "#3C1618",
    shape: "hexagon",
    width: 150,
    height: 110,
  }),
];

const eventDrivenEdges: CanvasEdge[] = [
  makeEdge("ev-e1", "ev-producer1", "ev-broker", "Publish"),
  makeEdge("ev-e2", "ev-producer2", "ev-broker", "Publish"),
  makeEdge("ev-e3", "ev-producer3", "ev-broker", "Publish"),
  makeEdge("ev-e4", "ev-broker", "ev-consumer1", "Subscribe"),
  makeEdge("ev-e5", "ev-broker", "ev-consumer2", "Subscribe"),
  makeEdge("ev-e6", "ev-broker", "ev-consumer3", "Subscribe"),
  makeEdge("ev-e7", "ev-broker", "ev-store", "Persist"),
  makeEdge("ev-e8", "ev-broker", "ev-dlq", "On Error"),
];

// ---------------------------------------------------------------------------
// Exported template registry
// ---------------------------------------------------------------------------

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description:
      "API Gateway fronting multiple independent services, each with its own database and a shared message queue for async communication.",
    nodes: microservicesNodes,
    edges: microservicesEdges,
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Source push triggers parallel build, test, and lint jobs. A quality gate controls promotion to staging then production, with live monitoring.",
    nodes: cicdNodes,
    edges: cicdEdges,
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Multiple producers publish domain events to a central broker. Independent consumers subscribe at their own pace, backed by an event store and dead-letter queue.",
    nodes: eventDrivenNodes,
    edges: eventDrivenEdges,
  },
];
