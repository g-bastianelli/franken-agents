import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const PLUGIN_ROOT = path.resolve(import.meta.dir, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(PLUGIN_ROOT, relativePath), "utf8");
}

function frontmatter(document) {
  const match = document.match(/^---\n([\s\S]*?)\n---/);
  expect(match).not.toBeNull();
  return match[1];
}

test("both runtimes discover the same canonical skills and resolvable shared contracts", () => {
  const claude = JSON.parse(read(".claude-plugin/plugin.json"));
  const codex = JSON.parse(read(".codex-plugin/plugin.json"));
  const skillRoot = path.resolve(PLUGIN_ROOT, claude.skills);
  expect(path.resolve(PLUGIN_ROOT, codex.skills)).toBe(skillRoot);

  for (const entry of fs.readdirSync(skillRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filename = path.join(skillRoot, entry.name, "SKILL.md");
    if (!fs.existsSync(filename)) continue;
    const document = fs.readFileSync(filename, "utf8");
    expect(frontmatter(document)).toMatch(new RegExp(`^name: ${entry.name}$`, "m"));
    for (const match of document.matchAll(/`\$\{CLAUDE_PLUGIN_ROOT\}\/([^`]+)`/g)) {
      expect(fs.existsSync(path.join(PLUGIN_ROOT, match[1])), match[1]).toBe(true);
    }
  }
});

test("Linear retrieval agents have only read capabilities", () => {
  for (const entry of fs.readdirSync(path.join(PLUGIN_ROOT, "agents"), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const document = read(`agents/${entry.name}`);
    const tools = frontmatter(document).match(/(?:^|\n)tools:\n([\s\S]*?)(?=\n\S|$)/);
    expect(tools).not.toBeNull();
    const names = [...tools[1].matchAll(/^\s*-\s*(.+)$/gm)].map((entry) => entry[1]);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /^mcp__claude_ai_Linear__(get|list)_/.test(name))).toBe(true);
  }
});
