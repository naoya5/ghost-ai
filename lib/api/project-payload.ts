const PROJECT_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PROJECT_ID_MAX_LENGTH = 128;

export function parseProjectId(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  if (!("id" in body)) return undefined;
  const raw = (body as { id: unknown }).id;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > PROJECT_ID_MAX_LENGTH) {
    return undefined;
  }
  if (!PROJECT_ID_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

export function parseProjectName(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  if (!("name" in body)) return undefined;
  const raw = (body as { name: unknown }).name;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseProjectDescription(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  if (!("description" in body)) return undefined;
  const raw = (body as { description: unknown }).description;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
