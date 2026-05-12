const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

export function parseCollaboratorEmail(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  if (!("email" in body)) return undefined;
  const raw = (body as { email: unknown }).email;
  if (typeof raw !== "string") return undefined;
  return normalizeCollaboratorEmail(raw);
}

export function normalizeCollaboratorEmail(raw: string): string | undefined {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LENGTH) {
    return undefined;
  }
  if (!EMAIL_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}
