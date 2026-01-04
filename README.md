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
      "command": "bun",
      "args": ["run", "/path/to/mcp-template/src/index.ts"]
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
bun run build      # Build for production
```

## License

MIT
