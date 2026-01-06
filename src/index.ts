#!/usr/bin/env bun
import { parseArgs } from "./cli.ts";
import { createHttpApp, initHttpConfig } from "./http.ts";
import { createServer } from "./server.ts";
import { runStdio } from "./stdio.ts";

const options = parseArgs(process.argv);

if (options.http) {
  const server = createServer();
  let config: ReturnType<typeof initHttpConfig>;
  try {
    config = initHttpConfig(options);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
  const app = createHttpApp(server, config);
  const httpServer = Bun.serve({
    hostname: config.hostname,
    port: config.port,
    fetch: app.fetch,
  });
  console.error(
    `MCP server listening on http://${config.hostname}:${httpServer.port}/mcp`,
  );

  process.on("SIGINT", () => {
    config.cleanup();
    httpServer.stop();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    config.cleanup();
    httpServer.stop();
    process.exit(0);
  });
} else {
  await runStdio();
}
