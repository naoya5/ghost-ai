import { logger, task, wait } from "@trigger.dev/sdk";

export const exampleTask = task({
  id: "example-task",
  // Retry / concurrency などはここで上書きできる。既定は trigger.config.ts を参照。
  maxDuration: 300,
  run: async (payload: { name: string }, { ctx }) => {
    logger.log("Running example task", { payload, ctx });

    await wait.for({ seconds: 2 });

    return {
      message: `Hello, ${payload.name}!`,
    };
  },
});
