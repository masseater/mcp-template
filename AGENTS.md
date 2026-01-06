# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# mcp-template

MCP サーバー開発のための汎用テンプレート

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Bun |
| MCP SDK | @modelcontextprotocol/sdk |
| HTTP Framework | Hono |
| Transport | stdio, HTTP (@hono/mcp) |
| Build | bun build |
| Lint/Format | Biome |
| Error Handling | neverthrow |
| Test | bun test |

## Commands

```bash
# Development
bun run dev              # Start with stdio transport
bun run dev:http         # Start with HTTP transport (insecure)

# Quality
bun run check            # Lint + format check
bun run check:fix        # Auto fix
bun run typecheck        # Type check

# Test
bun test                 # Run tests
bun test --watch         # Watch mode
bun test src/features/text-stats/text-stats.test.ts  # Single file

# Build
bun run build            # Build for production
```

## CLI Options

| Option | Description |
|--------|-------------|
| `--http` | HTTP モードで起動（デフォルトは stdio） |
| `--insecure` | 認証なしでの HTTP 起動を許可（localhost 限定、開発専用） |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HTTP` | - | `1` で HTTP モード起動 |
| `MCP_AUTH_SQLITE_PATH` | - | SQLite DB パス（指定時のみ認証有効化） |
| `MCP_HTTP_HOST` | `127.0.0.1` | HTTP バインドホスト |
| `MCP_HTTP_PORT` | `0` | HTTP ポート（`0` で自動割当） |
| `MCP_REQUIRE_TLS` | `1` | 非 localhost で HTTP 起動を許可するには `0` に設定 |
| `MCP_CORS_ORIGIN` | `*` | CORS 許可オリジン |

## Architecture

### Directory Structure

```
src/
├── index.ts              # Entry point (stdio/HTTP switch)
├── server.ts             # McpServer instantiation & primitive registration
├── definitions/          # MCP primitive definitions (thin wrappers)
│   ├── define.ts         # defineTool, defineResource, definePrompt helpers
│   ├── tools/index.ts    # Tool exports array
│   ├── resources/
│   └── prompts/
└── features/             # Business logic (pure functions, neverthrow)
    └── <name>/           # Feature directory with colocated tests
```

### Two-Layer Pattern

1. **definitions/**: MCP 定義の薄いラッパー。スキーマ定義とレスポンス整形のみ
2. **features/**: ビジネスロジック。MCP に依存しない純粋関数、`Result<T, E>` を返す

```
User Request → definitions/ (schema validation) → features/ (logic) → Response
```

### Adding New MCP Primitives

1. Create feature logic in `src/features/<name>/<name>.ts` returning `Result<T, E>`
2. Create definition in `src/definitions/tools/<name>.ts` using `defineTool()`
3. Export from `src/definitions/tools/index.ts`

## Debugging with MCP Inspector

MCP Inspector はサーバーのテストとデバッグ用のインタラクティブツール。

### 起動方法

```bash
bunx @modelcontextprotocol/inspector bun run src/index.ts
```

### Inspector の機能

| タブ | 用途 |
|------|------|
| Resources | リソース一覧、メタデータ確認、コンテンツ検査 |
| Prompts | プロンプトテンプレート確認、引数テスト |
| Tools | ツール一覧、スキーマ確認、カスタム入力でテスト実行 |

通知ペインでサーバーのログとリアルタイム通知を確認可能。

### 開発ワークフロー

1. Inspector でサーバー起動・接続確認
2. コード変更 → Inspector 再接続
3. 変更した機能をテスト、ログを確認

## Publishing

GitHub Actions の `Publish to npm` ワークフローで公開。`bun publish` を使用。

## Critical Conventions

- **stdio モードでは console.log 禁止**（stdin/stdout が MCP 通信に使われる。stderr のみ使用可）
- **bunx のみサポート**（npx は非対応。Bun 固有 API を使用しているため）
- **features/ は必ず機能単位のディレクトリを作成**（ファイル直置き禁止）
