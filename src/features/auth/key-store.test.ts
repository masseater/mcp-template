import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { existsSync, statSync, unlinkSync } from "node:fs";
import {
  closeKeyStore,
  type KeyStore,
  openKeyStore,
  validateKey,
} from "./key-store.ts";

const TEST_DB_PATH = "/tmp/mcp-auth-test.db";
const TEST_KEY = "a".repeat(64);

function cleanupTestDb(): void {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
}

function hashKeyWithPepper(key: string, pepper: string): string {
  return createHmac("sha256", pepper).update(key).digest("hex");
}

describe("key-store", () => {
  beforeEach(() => {
    cleanupTestDb();
  });

  afterEach(() => {
    cleanupTestDb();
  });

  describe("openKeyStore", () => {
    test("creates new database file if not exists", () => {
      const result = openKeyStore(TEST_DB_PATH);
      expect(result.isOk()).toBe(true);
      expect(existsSync(TEST_DB_PATH)).toBe(true);

      if (result.isOk()) {
        closeKeyStore(result.value);
      }
    });

    test("sets file permissions to 0600 for new DB", () => {
      const result = openKeyStore(TEST_DB_PATH);
      expect(result.isOk()).toBe(true);

      const stats = statSync(TEST_DB_PATH);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o600);

      if (result.isOk()) {
        closeKeyStore(result.value);
      }
    });

    test("opens existing database file", () => {
      const db = new Database(TEST_DB_PATH);
      db.run(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key_hash TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
      db.run(
        "INSERT INTO config (key, value) VALUES ('pepper', 'test-pepper')",
      );
      db.close();

      const result = openKeyStore(TEST_DB_PATH);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value.pepper).toBe("test-pepper");
        closeKeyStore(result.value);
      }
    });

    test("returns error if parent directory does not exist", () => {
      const result = openKeyStore("/nonexistent/dir/auth.db");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          "Parent directory does not exist",
        );
      }
    });

    test("creates schema and pepper automatically", () => {
      const result = openKeyStore(TEST_DB_PATH);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const db = result.value.db;
        const tables = db
          .query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='api_keys'",
          )
          .all();
        expect(tables.length).toBe(1);

        // Pepper should be generated
        expect(result.value.pepper).toBeTruthy();
        expect(result.value.pepper.length).toBe(64); // 32 bytes hex

        closeKeyStore(result.value);
      }
    });

    test("reuses existing pepper on reopen", () => {
      const result1 = openKeyStore(TEST_DB_PATH);
      expect(result1.isOk()).toBe(true);
      const pepper1 = result1.isOk() ? result1.value.pepper : "";
      if (result1.isOk()) closeKeyStore(result1.value);

      const result2 = openKeyStore(TEST_DB_PATH);
      expect(result2.isOk()).toBe(true);
      if (result2.isOk()) {
        expect(result2.value.pepper).toBe(pepper1);
        closeKeyStore(result2.value);
      }
    });
  });

  describe("validateKey", () => {
    let keyStore: KeyStore;

    beforeEach(() => {
      const result = openKeyStore(TEST_DB_PATH);
      if (result.isErr()) throw result.error;
      keyStore = result.value;

      // Insert key hash using HMAC with pepper
      const hash = hashKeyWithPepper(TEST_KEY, keyStore.pepper);
      keyStore.db.run("INSERT INTO api_keys (key_hash) VALUES (?)", [hash]);
    });

    afterEach(() => {
      closeKeyStore(keyStore);
    });

    test("returns true for valid key", () => {
      expect(validateKey(keyStore, TEST_KEY)).toBe(true);
    });

    test("returns false for invalid key", () => {
      expect(validateKey(keyStore, "invalid-key")).toBe(false);
    });

    test("returns false for empty key", () => {
      expect(validateKey(keyStore, "")).toBe(false);
    });

    test("returns false for oversized key", () => {
      const oversizedKey = "x".repeat(257);
      expect(validateKey(keyStore, oversizedKey)).toBe(false);
    });
  });
});
