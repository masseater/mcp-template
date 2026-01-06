import { Database } from "bun:sqlite";
import { createHmac, randomBytes } from "node:crypto";
import { chmodSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { err, ok, type Result } from "neverthrow";

const MAX_KEY_LENGTH = 256;

export type KeyStore = {
  db: Database;
  pepper: string;
};

function hashKey(key: string, pepper: string): string {
  return createHmac("sha256", pepper).update(key).digest("hex");
}

function generatePepper(): string {
  return randomBytes(32).toString("hex");
}

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const CREATE_INDEX_SQL = `CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)`;

const CREATE_CONFIG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

function getOrCreatePepper(db: Database): string {
  const row = db
    .query("SELECT value FROM config WHERE key = 'pepper'")
    .get() as { value: string } | null;
  if (row) {
    return row.value;
  }

  const pepper = generatePepper();
  db.run("INSERT INTO config (key, value) VALUES ('pepper', ?)", [pepper]);
  return pepper;
}

export function openKeyStore(dbPath: string): Result<KeyStore, Error> {
  try {
    const parentDir = dirname(dbPath);
    if (parentDir && parentDir !== "." && !existsSync(parentDir)) {
      return err(new Error(`Parent directory does not exist: ${parentDir}`));
    }

    const isNewDb = !existsSync(dbPath);
    const db = new Database(dbPath);

    // Set file permissions to 0600 for new DB files
    if (isNewDb) {
      chmodSync(dbPath, 0o600);
    }

    db.run(CREATE_TABLE_SQL);
    db.run(CREATE_INDEX_SQL);
    db.run(CREATE_CONFIG_TABLE_SQL);

    const pepper = getOrCreatePepper(db);

    return ok({ db, pepper });
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

export function closeKeyStore(store: KeyStore): void {
  store.db.close();
}

export function validateKey(store: KeyStore, inputKey: string): boolean {
  // Reject empty or oversized keys
  if (!inputKey || inputKey.length > MAX_KEY_LENGTH) {
    return false;
  }

  const hash = hashKey(inputKey, store.pepper);
  const result = store.db
    .query("SELECT 1 FROM api_keys WHERE key_hash = ? LIMIT 1")
    .get(hash);
  return result !== null;
}
