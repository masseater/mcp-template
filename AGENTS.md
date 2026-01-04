# CLAUDE.md

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
bun run dev:http         # Start with HTTP transport

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

## Directory Structure

```
src/
├── index.ts              # Entry point (stdio/HTTP switch)
├── definitions/          # MCP primitive definitions (thin wrappers)
│   ├── define.ts         # define* helpers
│   ├── tools/
│   ├── resources/
│   └── prompts/
└── features/             # Business logic (pure functions, neverthrow)
    └── <name>/           # Feature directory
```

## Architecture

The `define*` helpers (`defineTool`, `defineResource`, `definePrompt`) wrap MCP SDK registration with a consistent pattern. Each returns an object with a `.register(server)` method that's called in `src/index.ts`.

**Separation of concerns**: Complex logic goes in `src/features/` as pure functions returning `Result<T, E>` (neverthrow). MCP definitions in `src/definitions/` are thin wrappers that call feature functions and format responses.

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

## Conventions

- stdio モードではコンソール出力禁止（stdin/stdout が MCP 通信に使われるため）
- **bunx のみサポート**（npx は非対応。Bun 固有 API を使用しているため）
