import { z } from "zod";
import { defineTool } from "@/definitions/define.ts";

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
