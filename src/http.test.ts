import {
  afterAll,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

// Suppress console output during tests
mock.module("node:console", () => ({
  error: () => {},
  log: () => {},
  warn: () => {},
}));
const originalConsoleError = console.error;
console.error = () => {};
import { createHmac } from "node:crypto";
import { existsSync, unlinkSync } from "node:fs";
import {
  closeKeyStore,
  type KeyStore,
  openKeyStore,
} from "@/features/auth/key-store.ts";
import { createHttpApp, initHttpConfig } from "./http.ts";
import { createServer } from "./server.ts";

const TEST_DB_PATH = "/tmp/mcp-http-e2e-test.db";
const TEST_KEY = "test-api-key-" + "a".repeat(50);

const MCP_HEADERS = {
  Accept: "application/json, text/event-stream",
  "Content-Type": "application/json",
};

const MCP_REQUEST_BODY = JSON.stringify({
  jsonrpc: "2.0",
  method: "tools/list",
  id: 1,
});

function cleanupTestDb(): void {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
}

function hashKeyWithPepper(key: string, pepper: string): string {
  return createHmac("sha256", pepper).update(key).digest("hex");
}

describe("HTTP E2E Authentication", () => {
  let server: ReturnType<typeof Bun.serve>;
  let keyStore: KeyStore;

  beforeAll(() => {
    cleanupTestDb();

    // Setup environment for auth mode
    process.env.MCP_AUTH_SQLITE_PATH = TEST_DB_PATH;
    process.env.MCP_HTTP_PORT = "0"; // Auto-assign port

    // Initialize config and open key store
    const mcpServer = createServer();
    const config = initHttpConfig({ http: true, insecure: false });
    keyStore = config.keyStore!;

    // Register a valid test key
    const hash = hashKeyWithPepper(TEST_KEY, keyStore.pepper);
    keyStore.db.run("INSERT INTO api_keys (key_hash) VALUES (?)", [hash]);

    // Create and start HTTP server
    const app = createHttpApp(mcpServer, config);
    server = Bun.serve({
      hostname: config.hostname,
      port: config.port,
      fetch: app.fetch,
    });
  });

  afterAll(() => {
    server.stop();
    if (keyStore) {
      closeKeyStore(keyStore);
    }
    delete process.env.MCP_AUTH_SQLITE_PATH;
    delete process.env.MCP_HTTP_PORT;
    cleanupTestDb();
  });

  test("returns 401 when no Authorization header is provided", async () => {
    const response = await fetch(`http://localhost:${server.port}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: MCP_REQUEST_BODY,
    });

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("returns 401 when invalid API key is provided", async () => {
    const response = await fetch(`http://localhost:${server.port}/mcp`, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
        Authorization: "Bearer invalid-key-12345",
      },
      body: MCP_REQUEST_BODY,
    });

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("returns 400 when malformed Authorization header is provided", async () => {
    const response = await fetch(`http://localhost:${server.port}/mcp`, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
        Authorization: "Basic dXNlcjpwYXNz", // Basic auth instead of Bearer
      },
      body: MCP_REQUEST_BODY,
    });

    // Hono's bearerAuth returns 400 for malformed headers (not Bearer scheme)
    expect(response.status).toBe(400);
  });

  test("returns 200 when valid API key is provided", async () => {
    const response = await fetch(`http://localhost:${server.port}/mcp`, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
        Authorization: `Bearer ${TEST_KEY}`,
      },
      body: MCP_REQUEST_BODY,
    });

    expect(response.status).toBe(200);

    const text = await response.text();
    // MCP HTTP responses are in SSE format
    expect(text).toContain("event: message");
    expect(text).toContain('"jsonrpc":"2.0"');
    expect(text).toContain('"tools"');
  });

  test("handles CORS preflight without authentication", async () => {
    const response = await fetch(`http://localhost:${server.port}/mcp`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization, Content-Type",
      },
    });

    // OPTIONS should succeed without auth
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
  });
});

describe("HTTP E2E Insecure Mode", () => {
  let server: ReturnType<typeof Bun.serve>;
  let cleanup: () => void;

  beforeAll(() => {
    // Clear auth env var to test insecure mode
    delete process.env.MCP_AUTH_SQLITE_PATH;
    process.env.MCP_HTTP_PORT = "0";

    const mcpServer = createServer();
    const config = initHttpConfig({ http: true, insecure: true });
    cleanup = config.cleanup;

    const app = createHttpApp(mcpServer, config);
    server = Bun.serve({
      hostname: config.hostname,
      port: config.port,
      fetch: app.fetch,
    });
  });

  afterAll(() => {
    server.stop();
    cleanup();
    delete process.env.MCP_HTTP_PORT;
  });

  test("allows requests without authentication in insecure mode", async () => {
    const response = await fetch(`http://localhost:${server.port}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: MCP_REQUEST_BODY,
    });

    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain("event: message");
    expect(text).toContain('"tools"');
  });
});

describe("initHttpConfig validation", () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    // Restore original environment
    process.env.MCP_AUTH_SQLITE_PATH = originalEnv.MCP_AUTH_SQLITE_PATH;
    process.env.MCP_HTTP_HOST = originalEnv.MCP_HTTP_HOST;
    process.env.MCP_REQUIRE_TLS = originalEnv.MCP_REQUIRE_TLS;
  });

  test("throws error when no auth and not insecure", () => {
    delete process.env.MCP_AUTH_SQLITE_PATH;

    expect(() => {
      initHttpConfig({ http: true, insecure: false });
    }).toThrow("MCP_AUTH_SQLITE_PATH not set");
  });

  test("throws error when insecure mode on non-localhost", () => {
    delete process.env.MCP_AUTH_SQLITE_PATH;
    process.env.MCP_HTTP_HOST = "0.0.0.0";
    process.env.MCP_REQUIRE_TLS = "0"; // Disable TLS check to isolate insecure check

    expect(() => {
      initHttpConfig({ http: true, insecure: true });
    }).toThrow("Cannot run without authentication on non-localhost");

    // Reset
    process.env.MCP_HTTP_HOST = "127.0.0.1";
  });

  test("throws error when non-localhost requires TLS", () => {
    process.env.MCP_AUTH_SQLITE_PATH = TEST_DB_PATH;
    process.env.MCP_HTTP_HOST = "0.0.0.0";
    process.env.MCP_REQUIRE_TLS = "1";

    // First create DB so openKeyStore succeeds
    cleanupTestDb();
    const result = openKeyStore(TEST_DB_PATH);
    if (result.isOk()) {
      closeKeyStore(result.value);
    }

    expect(() => {
      initHttpConfig({ http: true, insecure: false });
    }).toThrow("requires TLS");

    // Reset and cleanup
    process.env.MCP_HTTP_HOST = "127.0.0.1";
    cleanupTestDb();
  });
});
