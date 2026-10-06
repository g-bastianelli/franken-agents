---
name: code-organisation
genre: contract
description: TypeScript code organization with named exports, declarative entry points, explicit ownership and package boundaries, reuse first, and a folder-shape check after structural edits.
user-invocable: false
paths: ["**/*.ts", "**/*.tsx"]
---

# subroutine — code-organisation discipline

For every TypeScript module; read the nearest `AGENTS.md` first.

## Shape modules around responsibilities

- One responsibility per file, named specifically (`partition.ts`).
- Group multiple resources into owner folders; colocate tests and private support.

```text
orders/
├── errors.ts
├── service.ts
├── service.test.ts
└── index.ts
```

## Keep entry points declarative

An `index.ts` composes or re-exports (`export { createOrdersService } from
"./service.js";`); business logic that deserves a name gets its own file.
Declare a library's public subpaths in `package.json#exports`; do not create a
barrel that exposes every internal module.

## Preserve readable code and boundaries

- Use `function` declarations for top-level functions and React components;
  use arrows for callbacks and inline expressions.
- Prefer small autonomous libraries with explicit runtime/layer direction.
  Avoid catch-all `shared`/`utils` packages that hide ownership.
- Search the repo and shared packages first; reuse established abstractions/imports.
- Do not copy a module under a "keep in sync" comment: extract it to the
  consumers' lowest common ancestor, or link the ticket when a package boundary
  forbids that.
- Comment only when it tells the reader what the code cannot: a non-obvious
  why or an API/framework pitfall, in one or two lines. No bug narratives (the
  commit holds them), no paraphrase, no multi-paragraph blocks in JSX. Matching
  the surrounding comment density never licenses narration.

## Check the settled folder

After structural edits, before verification/completion, run the repository lint
(`oxlint-plugin-code-rules` reports placement, façades, catch-all names and a
non-declarative `index.ts`), then review the settled tree and unchanged siblings
for what it cannot decide.

**REQUIRED SUB-SKILL:** Use `subroutine:check-folder-shape`
