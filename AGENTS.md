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
│   ├── define.ts          # define* helpers for MCP primitives
│   ├── tools/             # Tool definitions + index.ts registry
│   ├── resources/         # Resource definitions + index.ts registry
│   └── prompts/           # Prompt definitions + index.ts registry
└── features/             # Complex business logic
```

## Rules

- **Barrel exports**: Only `src/index.ts` and `src/mcps/*/index.ts` are allowed
- **Colocated tests**: Test files must be alongside source files (*.test.ts)
- **Path alias**: Use `@/` for src/ imports

## Adding New Primitives

### Tool

Add a new file under `src/mcps/tools/` and register it in `src/mcps/tools/index.ts`:

```typescript
import { defineTool } from "@/mcps/define.ts";
import { z } from "zod";

export const myTool = defineTool({
  name: "my-tool",
  title: "My Tool",
  description: "What this tool does",
  inputSchema: {
    param: z.string().describe("Parameter description"),
  },
  handler: async ({ param }) => ({
    content: [{ type: "text", text: "Result" }],
  }),
});
```

### Resource

Add a new file under `src/mcps/resources/` and register it in `src/mcps/resources/index.ts`:

```typescript
import { defineResource } from "@/mcps/define.ts";

export const myResource = defineResource({
  name: "my-resource",
  uri: "my-resource://path",
  title: "My Resource",
  description: "What this resource provides",
  mimeType: "text/plain",
  handler: async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/plain", text: "Content" }],
  }),
});
```

### Prompt

Add a new file under `src/mcps/prompts/` and register it in `src/mcps/prompts/index.ts`:

```typescript
import { definePrompt } from "@/mcps/define.ts";
import { z } from "zod";

export const myPrompt = definePrompt({
  name: "my-prompt",
  title: "My Prompt",
  description: "What this prompt does",
  argsSchema: {
    topic: z.string().describe("Topic to discuss"),
  },
  handler: ({ topic }) => ({
    messages: [
      { role: "user", content: { type: "text", text: `Discuss ${topic}` } },
    ],
  }),
});
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
