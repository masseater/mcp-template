# mcp-template

MCP サーバー開発のための汎用テンプレート

## Quick Start

```bash
# Install dependencies
bun install

# Run in stdio mode
bun run dev

# Run in HTTP mode
bun run dev:http
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mcp-template": {
      "command": "bunx",
      "args": ["mcp-template"]
    }
  }
}
```

## Available Primitives

### Tools

- **echo** - Returns the input message as-is

### Resources

- **info://server** - Server information

### Prompts

- **greeting** - Generates a greeting message

## Development

```bash
bun run check      # Lint & format check
bun run check:fix  # Auto fix
bun run typecheck  # Type check (tsgo)
bun run build      # Build for production
```
