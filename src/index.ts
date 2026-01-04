import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { Hono } from "hono";
import { greetingPrompt } from "./mcps/prompts/greeting.ts";
import { serverInfoResource } from "./mcps/resources/server-info.ts";
import { echoTool } from "./mcps/tools/echo.ts";

function createServer() {
  const server = new McpServer({
    name: "mcp-template",
    version: "0.0.1",
  });

  // Register tools
  server.registerTool(
    echoTool.name,
    {
      title: echoTool.title,
      description: echoTool.description,
      inputSchema: echoTool.inputSchema,
    },
    echoTool.handler,
  );

  // Register resources
  server.registerResource(
    serverInfoResource.name,
    serverInfoResource.uri,
    {
      title: serverInfoResource.title,
      description: serverInfoResource.description,
      mimeType: serverInfoResource.mimeType,
    },
    serverInfoResource.handler,
  );

  // Register prompts
  server.registerPrompt(
    greetingPrompt.name,
    {
      title: greetingPrompt.title,
      description: greetingPrompt.description,
      argsSchema: greetingPrompt.argsSchema,
    },
    greetingPrompt.handler,
  );

  return server;
}

async function runStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}

async function runHttp() {
  const app = new Hono();
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.post("/mcp", async (c) => {
    const sessionId = c.req.header("mcp-session-id");
    const body = await c.req.json();
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports[id] = transport;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = createServer();
      await server.connect(transport);
    } else {
      return c.json(
        {
          jsonrpc: "2.0",
          error: { code: -32000, message: "Invalid session" },
          id: null,
        },
        400,
      );
    }

    const response = await new Promise<Response>((resolve) => {
      const res = {
        writeHead: () => res,
        end: (data: string) =>
          resolve(
            new Response(data, {
              headers: { "Content-Type": "application/json" },
            }),
          ),
        write: () => {},
        setHeader: () => {},
        on: () => {},
      };
      transport.handleRequest(
        { body, headers: Object.fromEntries(c.req.raw.headers) } as never,
        res as never,
        body,
      );
    });

    return response;
  });

  app.get("/mcp", async (c) => {
    const sessionId = c.req.header("mcp-session-id");
    if (!sessionId || !transports[sessionId]) {
      return c.text("Invalid session", 400);
    }
    return c.text("SSE not implemented", 501);
  });

  app.delete("/mcp", async (c) => {
    const sessionId = c.req.header("mcp-session-id");
    if (sessionId && transports[sessionId]) {
      const transport = transports[sessionId];
      await transport.close();
      delete transports[sessionId];
    }
    return c.text("OK");
  });

  const port = Number(process.env.PORT) || 3000;
  console.error(`MCP server listening on http://localhost:${port}/mcp`);

  Bun.serve({
    port,
    fetch: app.fetch,
  });
}

async function main() {
  if (process.env.HTTP === "1") {
    await runHttp();
  } else {
    await runStdio();
  }
}

main().catch(console.error);
