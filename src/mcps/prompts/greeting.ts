import { z } from "zod";

export const greetingPrompt = {
  name: "greeting",
  title: "Greeting",
  description: "Generates a greeting message for a given name",
  argsSchema: {
    name: z.string().describe("The name of the person to greet"),
    style: z
      .enum(["formal", "casual", "friendly"])
      .optional()
      .describe("The style of greeting"),
  },
  handler: ({
    name,
    style,
  }: {
    name: string;
    style?: "formal" | "casual" | "friendly";
  }) => {
    const s = style ?? "friendly";
    const greetings = {
      formal: `Good day, ${name}. How may I assist you today?`,
      casual: `Hey ${name}! What's up?`,
      friendly: `Hello ${name}! Nice to meet you!`,
    } as const;
    const text = greetings[s];
    return {
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text },
        },
      ],
    };
  },
} as const;
