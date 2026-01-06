import { StreamableHTTPTransport } from "@hono/mcp";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import {
  closeKeyStore,
  type KeyStore,
  openKeyStore,
  validateKey,
} from "@/features/auth/key-store.ts";
import type { CliOptions } from "./cli.ts";

export type HttpConfig = {
  keyStore: KeyStore | null;
  corsOrigin: string;
  hostname: string;
  port: number;
  cleanup: () => void;
};

export function initHttpConfig(options: CliOptions): HttpConfig {
  let keyStore: KeyStore | null = null;

  const authDbPath = process.env.MCP_AUTH_SQLITE_PATH;
  if (authDbPath) {
    const result = openKeyStore(authDbPath);
    if (result.isErr()) {
      throw new Error(`Failed to open auth database: ${result.error.message}`);
    }
    keyStore = result.value;
    console.error(`Authentication enabled (SQLite: ${authDbPath})`);
  } else if (!options.insecure) {
    throw new Error(
      "MCP_AUTH_SQLITE_PATH not set. Use --insecure to run without authentication.",
    );
  } else {
    console.error("Warning: Running without authentication (--insecure mode).");
  }

  const corsOrigin = process.env.MCP_CORS_ORIGIN || "*";
  const hostname = process.env.MCP_HTTP_HOST || "127.0.0.1";
  const port = Number(process.env.MCP_HTTP_PORT) || 0;
  const requireTls = process.env.MCP_REQUIRE_TLS !== "0";

  const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";

  // Block insecure mode on non-localhost (fail-closed)
  if (!isLocalhost && !keyStore) {
    throw new Error(
      `Cannot run without authentication on non-localhost (${hostname}). ` +
        `Set MCP_AUTH_SQLITE_PATH to enable authentication.`,
    );
  }

  if (!isLocalhost && requireTls) {
    throw new Error(
      `HTTP on non-localhost (${hostname}) requires TLS. ` +
        `Use a reverse proxy with HTTPS, or set MCP_REQUIRE_TLS=0 to override.`,
    );
  }

  if (keyStore && corsOrigin === "*") {
    console.error(
      "Warning: CORS origin is '*' with authentication enabled. Consider setting MCP_CORS_ORIGIN.",
    );
  }

  const cleanup = () => {
    if (keyStore) {
      closeKeyStore(keyStore);
    }
  };

  return { keyStore, corsOrigin, hostname, port, cleanup };
}

export function createHttpApp(server: McpServer, config: HttpConfig) {
  const app = new Hono();
  const transport = new StreamableHTTPTransport();

  app.options(
    "/mcp",
    cors({
      origin: config.corsOrigin,
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(
    "/mcp",
    cors({
      origin: config.corsOrigin,
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  if (config.keyStore) {
    const keyStore = config.keyStore;
    app.use(
      "/mcp",
      bearerAuth({
        verifyToken: async (token) => validateKey(keyStore, token),
      }),
    );
  }

  let connectionPromise: Promise<void> | null = null;
  let connectionFailed = false;

  async function ensureConnected(): Promise<void> {
    if (server.isConnected()) return;

    if (connectionFailed) {
      connectionPromise = null;
      connectionFailed = false;
    }

    if (!connectionPromise) {
      connectionPromise = server.connect(transport).catch((e) => {
        connectionFailed = true;
        connectionPromise = null;
        throw e;
      });
    }

    await connectionPromise;
  }

  app.all("/mcp", async (c) => {
    await ensureConnected();
    return transport.handleRequest(c);
  });

  return app;
}
