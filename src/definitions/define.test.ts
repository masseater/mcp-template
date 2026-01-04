import { describe, expect, mock, test } from "bun:test";
import { z } from "zod";
import { definePrompt, defineResource, defineTool } from "./define";

describe("defineTool", () => {
  test("returns tool definition with register function", () => {
    const tool = defineTool({
      name: "test-tool",
      title: "Test Tool",
      description: "A test tool",
      inputSchema: {
        input: z.string().describe("Input value"),
      },
      handler: async ({ input }) => ({
        content: [{ type: "text", text: `Received: ${input}` }],
      }),
    });

    expect(tool.name).toBe("test-tool");
    expect(tool.title).toBe("Test Tool");
    expect(tool.description).toBe("A test tool");
    expect(tool.register).toBeFunction();
  });

  test("works without inputSchema", () => {
    const tool = defineTool({
      name: "no-input-tool",
      handler: async () => ({
        content: [{ type: "text", text: "No input needed" }],
      }),
    });

    expect(tool.name).toBe("no-input-tool");
    expect(tool.inputSchema).toBeUndefined();
    expect(tool.register).toBeFunction();
  });

  test("register calls server.registerTool with correct arguments", () => {
    let capturedName = "";
    let capturedConfig: { title?: string; description?: string } = {};

    const mockServer = {
      registerTool: mock(
        (name: string, config: { title?: string; description?: string }) => {
          capturedName = name;
          capturedConfig = config;
        },
      ),
    };

    const tool = defineTool({
      name: "mock-tool",
      title: "Mock Tool",
      description: "A mock tool",
      inputSchema: { value: z.number() },
      handler: async () => ({ content: [] }),
    });

    tool.register(mockServer as never);

    expect(mockServer.registerTool).toHaveBeenCalledTimes(1);
    expect(capturedName).toBe("mock-tool");
    expect(capturedConfig.title).toBe("Mock Tool");
    expect(capturedConfig.description).toBe("A mock tool");
  });
});

describe("defineResource", () => {
  test("returns static resource definition with register function", () => {
    const resource = defineResource({
      name: "test-resource",
      uri: "test://resource",
      title: "Test Resource",
      description: "A test resource",
      mimeType: "text/plain",
      handler: async () => ({
        contents: [{ uri: "test://resource", text: "content" }],
      }),
    });

    expect(resource.name).toBe("test-resource");
    expect(resource.uri).toBe("test://resource");
    expect(resource.mimeType).toBe("text/plain");
    expect(resource.register).toBeFunction();
  });

  test("register calls server.registerResource", () => {
    let capturedName = "";
    let capturedUri = "";

    const mockServer = {
      registerResource: mock((name: string, uri: string) => {
        capturedName = name;
        capturedUri = uri;
      }),
    };

    const resource = defineResource({
      name: "mock-resource",
      uri: "mock://uri",
      handler: async () => ({ contents: [] }),
    });

    resource.register(mockServer as never);

    expect(mockServer.registerResource).toHaveBeenCalledTimes(1);
    expect(capturedName).toBe("mock-resource");
    expect(capturedUri).toBe("mock://uri");
  });
});

describe("definePrompt", () => {
  test("returns prompt definition with register function", () => {
    const prompt = definePrompt({
      name: "test-prompt",
      title: "Test Prompt",
      description: "A test prompt",
      argsSchema: {
        topic: z.string().describe("Topic to discuss"),
      },
      handler: ({ topic }) => ({
        messages: [
          { role: "user", content: { type: "text", text: `About ${topic}` } },
        ],
      }),
    });

    expect(prompt.name).toBe("test-prompt");
    expect(prompt.title).toBe("Test Prompt");
    expect(prompt.register).toBeFunction();
  });

  test("register calls server.registerPrompt", () => {
    let capturedName = "";
    let capturedConfig: { argsSchema?: Record<string, unknown> } = {};

    const mockServer = {
      registerPrompt: mock(
        (name: string, config: { argsSchema?: Record<string, unknown> }) => {
          capturedName = name;
          capturedConfig = config;
        },
      ),
    };

    const prompt = definePrompt({
      name: "mock-prompt",
      argsSchema: { arg: z.string() },
      handler: () => ({ messages: [] }),
    });

    prompt.register(mockServer as never);

    expect(mockServer.registerPrompt).toHaveBeenCalledTimes(1);
    expect(capturedName).toBe("mock-prompt");
    expect(capturedConfig.argsSchema).toBeDefined();
  });
});
