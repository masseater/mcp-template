# mcp-template

MCP サーバー開発のための汎用テンプレート

> **Note**: このパッケージは **bunx のみサポート**しています（npx は非対応）

## QuickStart

### stdio モード（デフォルト）

```json
{
  "mcpServers": {
    "mcp-template": {
      "type": "stdio",
      "command": "bunx",
      "args": [
        "--install",
        "--silent",
        "@r_masseater/mcp-template@latest"
      ]
    }
  }
}
```

### HTTP モード

```bash
# 開発用（認証なし、localhost のみ）
bunx @r_masseater/mcp-template --http --insecure

# 本番用（認証あり）
MCP_AUTH_SQLITE_PATH=/path/to/auth.db bunx @r_masseater/mcp-template --http
```

## CLI Options

| Option | Description |
|--------|-------------|
| `--http` | HTTP モードで起動（デフォルトは stdio） |
| `--insecure` | 認証なしでの HTTP 起動を許可（localhost 限定、開発専用） |

## Authentication

HTTP モードでは Bearer トークン認証をサポートします。

### セキュリティ設計

- **fail-closed**: `MCP_AUTH_SQLITE_PATH` 未指定で HTTP 起動するには `--insecure` が必要
- **localhost 限定**: `--insecure` は localhost でのみ有効。非 localhost では認証必須
- **TLS 強制**: 非 localhost では `MCP_REQUIRE_TLS=0` を明示しない限り起動エラー
- **HMAC + pepper**: API キーは HMAC-SHA256 でハッシュ化。pepper は DB 内に自動生成・保存
- **DB パーミッション**: 新規作成時に 0600（所有者のみ読み書き）

### API キーの登録

```bash
# サーバー起動（DB とスキーマが自動作成される）
MCP_AUTH_SQLITE_PATH=/path/to/auth.db bunx @r_masseater/mcp-template --http

# 別ターミナルで pepper を取得
PEPPER=$(sqlite3 /path/to/auth.db "SELECT value FROM config WHERE key='pepper'")

# API キーを生成してハッシュ化
KEY=$(openssl rand -hex 32)
HASH=$(echo -n "$KEY" | openssl dgst -sha256 -hmac "$PEPPER" | cut -d' ' -f2)
echo "Your API key: $KEY"

# DB に登録
sqlite3 /path/to/auth.db "INSERT INTO api_keys (key_hash) VALUES ('$HASH');"
```

### クライアントからのリクエスト

```bash
curl -X POST http://localhost:<PORT>/mcp \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Available Primitives

### Tools

- **echo** - Returns the input message as-is

### Resources

- **info://server** - Server information

### Prompts

- **greeting** - Generates a greeting message
