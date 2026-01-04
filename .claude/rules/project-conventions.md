---
description: Project-wide conventions for code organization
---

# Project Conventions

## Barrel Exports

Only the following files are allowed to have barrel exports:
- `src/index.ts`
- `src/definitions/*/index.ts`

## Colocated Tests

Test files must be alongside source files with `*.test.ts` suffix.

```
src/features/
├── text-stats.ts
└── text-stats.test.ts  # Colocated
```

## Path Alias

Use `@/` for src/ imports instead of relative paths.

```typescript
// Good
import { defineTool } from "@/definitions/define.ts";

// Bad
import { defineTool } from "../../definitions/define.ts";
```
