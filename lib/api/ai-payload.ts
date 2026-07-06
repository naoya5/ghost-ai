// Boundary parsers for the AI design routes. Same shape as the project payload
// helpers: narrow `unknown` request bodies into trusted values (or undefined).

export interface DesignRequest {
  prompt: string;
  roomId: string;
  projectId: string;
}

export function parseDesignRequest(body: unknown): DesignRequest | undefined {
  if (typeof body !== "object" || body === null) return undefined;

  const record = body as Record<string, unknown>;
  const prompt = readTrimmedString(record.prompt);
  const roomId = readTrimmedString(record.roomId);
  const projectId = readTrimmedString(record.projectId);

  if (!prompt || !roomId || !projectId) return undefined;
  return { prompt, roomId, projectId };
}

export interface SpecRequest {
  roomId: string;
  chatHistory: unknown[];
  nodes: unknown[];
  edges: unknown[];
}

// Boundary parser for `POST /api/ai/spec`. Only `roomId` is trusted here (it
// resolves project access); `chatHistory`/`nodes`/`edges` are passed through as
// arrays and deeply validated with Zod inside the `generate-spec` task. A
// client-supplied `projectId` is intentionally ignored — access is derived from
// the authenticated user + `roomId`.
export function parseSpecRequest(body: unknown): SpecRequest | undefined {
  if (typeof body !== "object" || body === null) return undefined;

  const record = body as Record<string, unknown>;
  const roomId = readTrimmedString(record.roomId);
  if (!roomId) return undefined;

  const { chatHistory, nodes, edges } = record;
  if (
    !Array.isArray(chatHistory) ||
    !Array.isArray(nodes) ||
    !Array.isArray(edges)
  ) {
    return undefined;
  }

  return { roomId, chatHistory, nodes, edges };
}

export function parseRunId(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  return readTrimmedString((body as Record<string, unknown>).runId);
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
