import { echoTool } from "@/definitions/tools/echo.ts";
import { textStatsTool } from "@/definitions/tools/text-stats.ts";

export const tools = [echoTool, textStatsTool] as const;
