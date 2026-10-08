import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const AGENTS_DIR = path.resolve(import.meta.dir, "..", "agents");

// The runtime never shows an agent its own frontmatter, so every agent that applies
// shared/planning-context.md restates its budget in the body; the numbers must agree.
for (const file of fs.readdirSync(AGENTS_DIR)) {
  const source = fs.readFileSync(path.join(AGENTS_DIR, file), "utf8");
  if (!source.includes("planning-context.md")) continue;

  test(`${file} states the turn budget matching its maxTurns, with a half-budget return`, () => {
    const maxTurns = Number(/^maxTurns: (\d+)$/m.exec(source)?.[1]);
    const budget = /^Turn budget: (\d+)\. Return .+ by turn (\d+)\.$/m.exec(source);

    expect(budget).not.toBeNull();
    expect(Number(budget[1])).toBe(maxTurns);
    expect(Number(budget[2])).toBe(Math.floor(maxTurns / 2));
  });
}
