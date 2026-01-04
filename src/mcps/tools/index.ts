import { echoTool } from "@/mcps/tools/echo.ts";
import { textStatsTool } from "@/mcps/tools/text-stats.ts";

export const tools = [echoTool, textStatsTool] as const;
