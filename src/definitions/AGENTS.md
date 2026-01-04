# definitions/

MCP プリミティブ（Tool, Resource, Prompt）の定義を格納するディレクトリ。

## 責務

- **シンプルな定義のみ**: 入力スキーマ、メタデータ、handler の薄いラッパー
- **複雑なロジックは禁止**: ビジネスロジックは `src/features/` に実装し、ここから呼び出す

## Good Example

```typescript
// definitions/tools/text-stats.ts
export const textStatsTool = defineTool({
  name: "text-stats",
  inputSchema: { text: z.string() },
  handler: async ({ text }) => {
    const result = analyzeText(text);  // features/ の関数を呼ぶだけ
    // ...format response
  },
});
```

## Bad Example

```typescript
// definitions/tools/text-stats.ts
export const textStatsTool = defineTool({
  handler: async ({ text }) => {
    // NG: 複雑なロジックを直接書いている
    const words = text.split(/\s+/).filter(Boolean).length;
    const lines = text.split(/\r?\n/).length;
    // ...
  },
});
```
