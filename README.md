# mcp-template

MCP サーバー開発のための汎用テンプレート

> **Note**: このパッケージは **bunx のみサポート**しています（npx は非対応）

## QuickStart

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

## Environment Variables

It's sample. Must Update.

| Variable | Required | Description |
|----------|----------|-------------|
| `FOO` | ✓ | FOO description |
| `BAR` | - | BAR description |

## Available Primitives

### Tools

- **echo** - Returns the input message as-is

### Resources

- **info://server** - Server information

### Prompts

- **greeting** - Generates a greeting message
