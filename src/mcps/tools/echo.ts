import { defineTool } from "@/mcps/define.ts";
import { z } from "zod";

export const echoTool = defineTool({
  name: "echo",
  title: "Echo",
  description: "Returns the input message as-is. Useful for testing.",
  inputSchema: {
    message: z.string().describe("The message to echo back"),
  },
  handler: async ({ message }: { message: string }) => ({
    content: [{ type: "text" as const, text: message }],
  }),
});
