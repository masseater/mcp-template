import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prompts } from "@/definitions/prompts";
import { resources } from "@/definitions/resources";
import { tools } from "@/definitions/tools";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-template",
    version: "0.0.1",
  });

  for (const tool of tools) {
    tool.register(server);
  }
  for (const resource of resources) {
    resource.register(server);
  }
  for (const prompt of prompts) {
    prompt.register(server);
  }

  return server;
}
