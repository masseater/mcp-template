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
| Transport | stdio, HTTP (StreamableHTTPServerTransport) |
| Build | tsup |
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
