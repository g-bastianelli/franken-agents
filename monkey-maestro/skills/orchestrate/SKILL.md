---
name: orchestrate
description: Supervise an authorized Linear project through issue delivery, native review, and protected merge. Uses one Superset workspace per issue and refills capacity from fresh Linear state while the supervisor session runs.
argument-hint: "<linear-project-id>"
effort: high
allowed-tools: Read, Write, Edit, Bash(node:*), Bash(sleep:*), Bash(git rev-parse:*), Bash(git check-ignore:*), Bash(superset tasks get:*), Bash(superset tasks list:*), Bash(superset workspaces list:*), Bash(superset workspaces get:*), Bash(superset workspaces create:*), Bash(superset workspaces update:*), Bash(superset agents create:*), Bash(superset agents read:*), Bash(superset terminals list:*), Bash(superset terminals read:*), Bash(superset terminals send:*), Agent, mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__list_issue_statuses, mcp__claude_ai_Linear__save_issue
---

# orchestrate

> Agent resolution: before dispatch, read `${CLAUDE_PLUGIN_ROOT}/shared/agent-runtime-map.md`
> and select the active runtime name for `monkey-maestro:linear-reader`.

## Voice

Read `../../persona.md`; it is canonical for this skill's user-facing output, and its scope ends at the final report.

## Contract

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-execution-contract.md`. Linear alone decides
capacity and readiness. Superset receives selected work but never changes the plan.

## Workflow

1. Require one exact Linear project id and establish **Supervisor ownership** from the
   shared contract. An active control alone does not prove this session owns supervision.
   Unknown ownership allows read-only inspection, not a second loop. When recovering after
   compaction or considering a local checkpoint, read the **Checkpoint locally** section of
   [`references/supervision.md`](references/supervision.md) before writing any ledger.
   Refresh recorded observations before acting. Dispatch `monkey-maestro:linear-reader` in
   `MODE: project`. Consume only its exact project identity, complete marker comment set,
   minimal status/blocker rows, and scoped unknowns.
2. Pass the comments through `scripts/records.mjs resolve-controls`. Require one usable
   active control for the exact project with `deliveryScope: issue-through-merge` and its
   valid stored `workspaceGroup`. Reuse that exact group throughout this run. Inactive,
   absent, unsupported, or unusable authority allows observation only; create no workspace,
   reserve no issue, change no tags, and send no new work. Explain when explicit `start` is needed.
3. Require a complete live Linear project issue set. A failed project, page, or issue read
   creates no workspace. Classify only from current status types and `blockedBy`
   identifiers:
   - count every known `started` issue;
   - candidates are known `backlog`, `triage`, and `unstarted` issues;
   - a candidate is ready only when every blocker is present and terminal;
   - terminal issues are `completed` or `canceled`.
     If no nonterminal or unknown issue remains, report `complete` from the observed Linear
     facts. Report owned issue delivery evidence separately; never invent a PR for externally
     completed or canceled work.
4. Compute `slots = max(0, maxConcurrency - startedCount)`. Sort ready issues by Linear
   identifier and select the first `slots`. Started issues consume capacity but are never
   redispatched. No free slot means monitor existing workers. If no owned worker or ready
   issue can progress, report the blocking Linear facts and checkpoint; do not spin.
5. For a non-empty selection, dispatch the reader in `MODE: selected` with exactly those ids. It
   refreshes those candidates plus their direct blockers. Reclassify every selected issue
   from this bounded result and require it to remain ready. In parallel, fetch each exact
   Superset task using the shared contract's exact tracker binding. A changed, unknown,
   terminal, or non-ready issue, or a failed detail/task read, fails only that selected issue;
   do not backfill from this snapshot.
6. Before creating any workspace, read
   [`references/dispatch.md`](references/dispatch.md). Apply its placement,
   create-or-reuse with binding readback, setup readiness, started reservation, current-control recheck, worker-prompt, and launch
   contract. This writes only an authorized issue's started state; `deliver` owns completion.
7. When a worker exists, a prior launch needs inspection, or a proven owned workspace
   needs group verification/repair, read
   [`references/supervision.md`](references/supervision.md). Monitor each owned worker and
   verify its run group on resume and relay only scoped follow-ups to its existing session.
   A tag update is limited to restoring this run's missing group on a proven owned
   workspace, preserving every other tag. Observe actual delivery evidence;
   collect actionable questions while independent issues continue. A user stop or inactive
   control ends new dispatch and recovery, leaving existing jobs intact.
8. After worker progress or a 30–60 second observation interval, return to step 1 with a
   complete fresh Linear read. Never refill from worker claims or a previous capacity count.
   Use an available native runtime wait/yield that applies to the pending operation;
   otherwise use one `sleep 15` or `sleep 30` shell call between observations. Never wait
   more than 60 seconds in one blocking call, create a polling script, or busy-loop reads.
   Cap read failures at two retries; ambiguous mutations receive no blind retry. If all work
   is terminal, report `complete`. If all remaining work awaits unavailable decisions,
   transport, or external events, report `waiting` with exact resumption instructions.

The loop runs in this active agent session. It creates no background daemon, scheduler,
durable queue, or automation. A closed session stops supervision even when control is active.

## Report

```text
monkey-maestro:orchestrate report
  Project/run: <project id> / <run id>
  Linear:      started <n> · ready <n> · slots <n>
  Work:        <per-issue running / waiting / blocked / done, with evidence>
  Group:       <exact workspaceGroup from control; placement verified or unresolved>
  Superset:    <per-issue dispatched / already-existing / create-failed / launch-failed / launch-unknown>
  Questions:   <issue id, decision needed, and affected scope or none>
  Recovery:    <same workspace/session and next missing step or none>
  Supervisor:  active session | checkpointed | ended
  Exit:        complete | waiting | degraded | stopped
```
