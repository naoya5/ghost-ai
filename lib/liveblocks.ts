import "server-only";

import { Liveblocks } from "@liveblocks/node";

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }
  return new Liveblocks({ secret });
}

const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: Liveblocks;
};

export function getLiveblocks(): Liveblocks {
  const client = globalForLiveblocks.liveblocks ?? createLiveblocksClient();
  if (process.env.NODE_ENV !== "production") {
    globalForLiveblocks.liveblocks = client;
  }
  return client;
}
