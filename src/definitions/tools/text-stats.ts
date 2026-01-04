import { z } from "zod";
import { defineTool } from "@/definitions/define";
import { analyzeText, formatStats } from "@/features/text-stats/text-stats";

export const textStatsTool = defineTool({
  name: "text-stats",
  title: "Text Statistics",
  description:
    "Analyzes text and returns statistics including character count, word count, line count, and paragraph count.",
  inputSchema: {
    text: z.string().describe("The text to analyze"),
  },
  handler: async ({ text }) => {
    const result = analyzeText(text);

    if (result.isErr()) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: result.error.message }],
      };
    }

    return {
      content: [{ type: "text" as const, text: formatStats(result.value) }],
    };
  },
});
