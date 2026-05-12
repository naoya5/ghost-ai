import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

export interface ClerkUserSummary {
  displayName: string | null;
  imageUrl: string | null;
}

const LOOKUP_BATCH_SIZE = 100;

function composeDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string | null {
  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(" ")
    .trim();
  if (fullName) return fullName;
  if (user.username && user.username.trim().length > 0) {
    return user.username.trim();
  }
  return null;
}

export async function lookupClerkUsersByEmail(
  emails: string[],
): Promise<Map<string, ClerkUserSummary>> {
  const result = new Map<string, ClerkUserSummary>();
  const unique = Array.from(new Set(emails.map((email) => email.toLowerCase())));
  if (unique.length === 0) return result;

  let client;
  try {
    client = await clerkClient();
  } catch {
    return result;
  }

  for (let i = 0; i < unique.length; i += LOOKUP_BATCH_SIZE) {
    const batch = unique.slice(i, i + LOOKUP_BATCH_SIZE);
    try {
      const response = await client.users.getUserList({
        emailAddress: batch,
        limit: batch.length,
      });
      const users = Array.isArray(response) ? response : response.data;
      const batchSet = new Set(batch);
      for (const user of users) {
        const summary: ClerkUserSummary = {
          displayName: composeDisplayName(user),
          imageUrl: user.imageUrl ?? null,
        };
        for (const addr of user.emailAddresses ?? []) {
          const normalized = addr.emailAddress?.toLowerCase();
          if (!normalized || !batchSet.has(normalized)) continue;
          if (!result.has(normalized)) {
            result.set(normalized, summary);
          }
        }
      }
    } catch {
      // Network/permission errors fall through to the email-only fallback.
    }
  }

  return result;
}
