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

# Build
bun run build            # Build for production
```

## Directory Structure

```
src/
├── index.ts              # Entry point (stdio/HTTP switch)
├── mcps/
│   ├── tools/            # Tool definitions only
│   ├── resources/        # Resource definitions only
│   └── prompts/          # Prompt definitions only
└── features/             # Complex business logic
```

## Rules

- **No barrel exports**: index.ts for aggregation is prohibited (except src/index.ts)
- **Colocated tests**: Test files must be alongside source files (*.test.ts)
- **Path alias**: Use `@/` for src/ imports

## Adding New Primitives

### Tool

Add to `src/index.ts`:

```typescript
server.registerTool(
  "my-tool",
  {
    title: "My Tool",
    description: "What this tool does",
    inputSchema: {
      param: z.string().describe("Parameter description"),
    },
  },
  async ({ param }) => ({
    content: [{ type: "text", text: "Result" }],
  })
);
```

### Resource

Add to `src/index.ts`:

```typescript
server.registerResource(
  "my-resource",
  "my-resource://path",
  {
    title: "My Resource",
    description: "What this resource provides",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/plain", text: "Content" }],
  })
);
```

### Prompt

Add to `src/index.ts`:

```typescript
server.registerPrompt(
  "my-prompt",
  {
    title: "My Prompt",
    description: "What this prompt does",
    argsSchema: {
      topic: z.string().describe("Topic to discuss"),
    },
  },
  ({ topic }) => ({
    messages: [
      { role: "user", content: { type: "text", text: `Discuss ${topic}` } },
    ],
  })
);
```

## Error Handling

Use neverthrow for explicit error handling:

```typescript
import { ok, err, Result } from "neverthrow";

function divide(a: number, b: number): Result<number, Error> {
  if (b === 0) {
    return err(new Error("Division by zero"));
  }
  return ok(a / b);
}
```

## Publishing

1. Update version in package.json
2. Run workflow_dispatch on GitHub Actions (publish.yml)
