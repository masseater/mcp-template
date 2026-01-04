# mcp-template

MCP サーバー開発のための汎用テンプレート

> **Note**: このパッケージは **bunx のみサポート**しています（npx は非対応）

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

## Publishing

npmへの公開はGitHub Actionsで行います。

1. GitHubリポジトリの **Actions** タブを開く
2. 左のワークフロー一覧から **Publish to npm** を選択
3. **Run workflow** をクリック
4. バージョン番号を入力（例: `0.1.0`）
5. **Run workflow** を実行

### 必要な設定

- `NPM_TOKEN`: npmのアクセストークンをリポジトリのSecretsに設定
