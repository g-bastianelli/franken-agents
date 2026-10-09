#!/usr/bin/env node
import fs from "node:fs";
import { createClaudeRuntime } from "../lib/runtime.mjs";
import { extractIssueId } from "./state.mjs";

if (!process.env.CLAUDE_PLUGIN_DATA && !process.env.PLUGIN_DATA) process.exit(0);

const runtime = createClaudeRuntime();
const statePath = (sessionId) => runtime.sessionStatePath("state", sessionId);

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const { session_id, prompt } = readStdinJson();
if (!session_id) process.exit(0);

const state = runtime.readJson(statePath(session_id), null);
if (!state || state.awaiting_prompt !== true) process.exit(0);

const issue = extractIssueId(prompt || "");
// The explicitly named delivery owner loads its own context on this fresh first prompt.
// This suppresses an advisory prompt only; it never grants delivery authority.
const hasDeliveryOwner = /\blinear-devotee:deliver\b/i.test(prompt || "");

const updated = {
  ...state,
  greeted: issue ? (state.greeted ?? false) : true,
  awaiting_prompt: false,
  issue: issue ?? state.issue ?? null,
  source: issue ? "prompt" : state.source,
};
runtime.writeJson(statePath(session_id), updated);

if (issue && !hasDeliveryOwner) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: `linear-devotee detected Linear issue ${issue} in your prompt. Follow the user's explicit workflow and scope first. Full delivery belongs to \`linear-devotee:deliver\`, which loads its own context; do not prepend greet. Otherwise use \`linear-devotee:greet\` once for fresh issue context when relevant. An issue id alone does not authorize implementation or merge.`,
      },
    }),
  );
}
