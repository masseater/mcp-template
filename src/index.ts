#!/usr/bin/env bun
import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Hono } from "hono";
import { prompts } from "@/definitions/prompts";
import { resources } from "@/definitions/resources";
import { tools } from "@/definitions/tools";

function createServer() {
  const server = new McpServer({
    name: "mcp-template",
    version: "0.0.1",
  });

  for (const tool of tools) {
    tool.register(server);
  }
  for (const resource of resources) {
    resource.register(server);
  }
  for (const prompt of prompts) {
    prompt.register(server);
  }

  return server;
}

async function runStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function createHttpApp() {
  const app = new Hono();
  const server = createServer();
  const transport = new StreamableHTTPTransport();

  app.all("/mcp", async (c) => {
    if (!server.isConnected()) {
      await server.connect(transport);
    }
    return transport.handleRequest(c);
  });

  return app;
}

if (process.env.HTTP === "1") {
  const app = createHttpApp();
  const httpServer = Bun.serve({
    port: 0,
    fetch: app.fetch,
  });
  console.error(
    `MCP server listening on http://localhost:${httpServer.port}/mcp`,
  );
} else {
  await runStdio();
}
