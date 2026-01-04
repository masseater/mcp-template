---
description: Error handling conventions using neverthrow
---

# Error Handling

Use neverthrow for explicit error handling. Never throw exceptions for expected errors.

## Pattern

```typescript
import { ok, err, Result } from "neverthrow";

type MyError = {
  code: "INVALID_INPUT" | "NOT_FOUND";
  message: string;
};

function process(input: string): Result<Output, MyError> {
  if (!input) {
    return err({ code: "INVALID_INPUT", message: "Input required" });
  }
  return ok(processedValue);
}
```

## Usage in MCP Tools

```typescript
handler: async ({ input }) => {
  const result = processFeature(input);

  if (result.isErr()) {
    return {
      isError: true,
      content: [{ type: "text", text: result.error.message }],
    };
  }

  return {
    content: [{ type: "text", text: formatOutput(result.value) }],
  };
}
```
