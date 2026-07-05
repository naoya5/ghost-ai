import { defineConfig } from "@trigger.dev/sdk";
import { config as loadEnv } from "dotenv";

// Trigger CLI は既定で .env のみ自動ロードするため、.env.local を明示的に読み込む。
loadEnv({ path: ".env.local" });
loadEnv(); // .env（.env.local が優先。既存の値は上書きしない）

const projectRef = process.env.TRIGGER_PROJECT_REF;

if (!projectRef) {
  throw new Error(
    "TRIGGER_PROJECT_REF is not set. Add it to your .env.local (e.g. TRIGGER_PROJECT_REF=proj_xxxxx).",
  );
}

export default defineConfig({
  project: projectRef,
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./trigger"],
});
