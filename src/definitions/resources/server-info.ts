import { defineResource } from "@/definitions/define.ts";

export const serverInfoResource = defineResource({
  name: "server-info",
  uri: "info://server",
  title: "Server Info",
  description: "Provides information about this MCP server",
  mimeType: "application/json",
  handler: async (uri: URL) => {
    const info = {
      name: "mcp-template",
      version: "0.0.1",
      description: "MCP サーバー開発のための汎用テンプレート",
      capabilities: { tools: true, resources: true, prompts: true },
    };
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  },
});
