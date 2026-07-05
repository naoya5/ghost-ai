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

export function parseRunId(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  return readTrimmedString((body as Record<string, unknown>).runId);
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
