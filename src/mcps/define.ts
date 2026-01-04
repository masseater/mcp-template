import type {
  McpServer,
  PromptCallback,
  ReadResourceCallback,
  ReadResourceTemplateCallback,
  ResourceMetadata,
  ResourceTemplate,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type {
  AnySchema,
  ZodRawShapeCompat,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";

type BaseToolDefinition<
  OutputArgs extends undefined | ZodRawShapeCompat | AnySchema,
> = {
  name: string;
  title?: string;
  description?: string;
  outputSchema?: OutputArgs;
  annotations?: ToolAnnotations;
  _meta?: Record<string, unknown>;
};

type ToolDefinitionNoInput<
  OutputArgs extends undefined | ZodRawShapeCompat | AnySchema,
> = BaseToolDefinition<OutputArgs> & {
  inputSchema?: undefined;
  handler: ToolCallback<undefined>;
};

type ToolDefinitionWithInput<
  InputArgs extends ZodRawShapeCompat | AnySchema,
  OutputArgs extends undefined | ZodRawShapeCompat | AnySchema,
> = BaseToolDefinition<OutputArgs> & {
  inputSchema: InputArgs;
  handler: ToolCallback<InputArgs>;
};

type BasePromptDefinition = {
  name: string;
  title?: string;
  description?: string;
};

type PromptDefinitionWithArgs<Args extends ZodRawShapeCompat> =
  BasePromptDefinition & {
    argsSchema: Args;
    handler: PromptCallback<Args>;
  };

type StaticResourceDefinition = {
  name: string;
  uri: string;
  title?: string;
  description?: string;
  mimeType?: string;
  handler: ReadResourceCallback;
};

type TemplateResourceDefinition = {
  name: string;
  uri: ResourceTemplate;
  title?: string;
  description?: string;
  mimeType?: string;
  handler: ReadResourceTemplateCallback;
};

function hasInputSchema(
  tool:
    | ToolDefinitionNoInput<undefined | ZodRawShapeCompat | AnySchema>
    | ToolDefinitionWithInput<
        ZodRawShapeCompat | AnySchema,
        undefined | ZodRawShapeCompat | AnySchema
      >,
): tool is ToolDefinitionWithInput<
  ZodRawShapeCompat | AnySchema,
  undefined | ZodRawShapeCompat | AnySchema
> {
  return tool.inputSchema !== undefined;
}

function isTemplateResource(
  resource: StaticResourceDefinition | TemplateResourceDefinition,
): resource is TemplateResourceDefinition {
  return typeof resource.uri !== "string";
}

export function defineTool<
  OutputArgs extends undefined | ZodRawShapeCompat | AnySchema = undefined,
>(tool: ToolDefinitionNoInput<OutputArgs>): ToolDefinitionNoInput<OutputArgs> & {
  register: (server: McpServer) => void;
};
export function defineTool<
  InputArgs extends ZodRawShapeCompat | AnySchema,
  OutputArgs extends undefined | ZodRawShapeCompat | AnySchema = undefined,
>(
  tool: ToolDefinitionWithInput<InputArgs, OutputArgs>,
): ToolDefinitionWithInput<InputArgs, OutputArgs> & {
  register: (server: McpServer) => void;
};
export function defineTool(
  tool:
    | ToolDefinitionNoInput<undefined | ZodRawShapeCompat | AnySchema>
    | ToolDefinitionWithInput<
        ZodRawShapeCompat | AnySchema,
        undefined | ZodRawShapeCompat | AnySchema
      >,
) {
  return {
    ...tool,
    register(server: McpServer) {
      const baseConfig = {
        title: tool.title,
        description: tool.description,
        outputSchema: tool.outputSchema,
        annotations: tool.annotations,
        _meta: tool._meta,
      };
      if (hasInputSchema(tool)) {
        server.registerTool<
          ZodRawShapeCompat | AnySchema,
          ZodRawShapeCompat | AnySchema
        >(
          tool.name,
          { ...baseConfig, inputSchema: tool.inputSchema },
          tool.handler,
        );
      } else {
        server.registerTool(tool.name, baseConfig, tool.handler);
      }
    },
  } as const;
}

export function defineResource(
  resource: StaticResourceDefinition,
): StaticResourceDefinition & { register: (server: McpServer) => void };
export function defineResource(
  resource: TemplateResourceDefinition,
): TemplateResourceDefinition & { register: (server: McpServer) => void };
export function defineResource(
  resource: StaticResourceDefinition | TemplateResourceDefinition,
) {
  return {
    ...resource,
    register(server: McpServer) {
      const metadata: ResourceMetadata = {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType,
      };
      if (isTemplateResource(resource)) {
        server.registerResource(
          resource.name,
          resource.uri,
          metadata,
          resource.handler,
        );
      } else {
        server.registerResource(
          resource.name,
          resource.uri,
          metadata,
          resource.handler,
        );
      }
    },
  } as const;
}

export function definePrompt<Args extends ZodRawShapeCompat>(
  prompt: PromptDefinitionWithArgs<Args>,
) {
  return {
    ...prompt,
    register(server: McpServer) {
      server.registerPrompt(
        prompt.name,
        {
          title: prompt.title,
          description: prompt.description,
          argsSchema: prompt.argsSchema,
        },
        prompt.handler,
      );
    },
  } as const;
}
