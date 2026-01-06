import { afterEach, describe, expect, test } from "bun:test";
import { parseArgs } from "./cli.ts";

describe("parseArgs", () => {
  const originalEnv = process.env.HTTP;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.HTTP;
    } else {
      process.env.HTTP = originalEnv;
    }
  });

  test("returns http: false by default", () => {
    delete process.env.HTTP;
    const result = parseArgs(["node", "index.ts"]);
    expect(result.http).toBe(false);
    expect(result.insecure).toBe(false);
  });

  test("returns http: true with --http flag", () => {
    delete process.env.HTTP;
    const result = parseArgs(["node", "index.ts", "--http"]);
    expect(result.http).toBe(true);
  });

  test("returns http: true with HTTP=1 env var", () => {
    process.env.HTTP = "1";
    const result = parseArgs(["node", "index.ts"]);
    expect(result.http).toBe(true);
  });

  test("returns insecure: true with --insecure flag", () => {
    const result = parseArgs(["node", "index.ts", "--insecure"]);
    expect(result.insecure).toBe(true);
  });

  test("handles both --http and --insecure flags", () => {
    delete process.env.HTTP;
    const result = parseArgs(["node", "index.ts", "--http", "--insecure"]);
    expect(result.http).toBe(true);
    expect(result.insecure).toBe(true);
  });

  test("handles flags in any order", () => {
    delete process.env.HTTP;
    const result = parseArgs(["node", "index.ts", "--insecure", "--http"]);
    expect(result.http).toBe(true);
    expect(result.insecure).toBe(true);
  });
});
