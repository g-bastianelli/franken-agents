---
name: deliver
description: Deliver one Linear issue through implementation, PR review, corrections, protected merge, and verified Linear completion. Reuse its workspace and PR after interruption. Use for full delivery, including an authorized Maestro worker; brief or plan-only requests keep their narrower scope.
argument-hint: "[issue-id] [existing-pr-url]"
effort: high
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, ToolSearch, Skill(linear-devotee:plan *), Skill(git-gremlin:finish-pr *), Bash(git status:*), Bash(git branch --show-current), Bash(git branch --list:*), Bash(git diff:*), Bash(git log:*), Bash(git rev-parse:*), Bash(git remote -v), Bash(git remote get-url:*), Bash(git switch -c:*), Bash(git ls-files:*), Bash(git check-ignore:*), Bash(gh auth status:*), Bash(gh repo view:*), Bash(gh pr list:*), Bash(gh pr view:*), mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__list_issue_statuses, mcp__claude_ai_Linear__save_issue
---

# linear-devotee:deliver

Own one issue until its PR is merged and Linear completion is observed, or return the specific
waiting condition or decision. Work in the current runtime on Claude Code or Codex.

## Voice

Read `../../persona.md`; it is canonical for this skill's user-facing output until the final
report. Keep progress and questions concise: the offering is the delivered work.

## Workflow

1. **Establish scope and authority.** Resolve the issue and repository from the explicit request
   or authorized caller. Read repository instructions. An explicit execution of this full-delivery
   skill, including a Maestro dispatch carrying that authority, authorizes scoped implementation,
   status transitions, commits, pushes, a draft PR, review fixes and replies, thread resolution,
   and a merge that respects repository protections. Reuse that authority at every handoff.
   A brief, plan-only, draft-PR-only, review-only, or read-only request retains that boundary;
   route to its requested skill and stop before any broader delivery. An issue id, hook, or
   ledger alone cannot enlarge the user's request. Conflicting scope requires a decision.
   Claude's scoped tool grants apply only to the invoking turn; runtime permissions still
   apply on resume and to other providers or commands. Chained skills own their tool grants.
   Delivery authority never permits bypassing a denied tool or weakening permission settings.
2. **Reconcile actual work.** Resolve `PLUGIN_ROOT` from this skill's directory (`../..`) or
   the active runtime's plugin root. Read `../../shared/provider-selection.md` and
   `../../shared/planning-context.md`. Inspect the current repository, workspace, branch,
   dirty changes, and any explicitly linked PR. Otherwise look up a PR for the exact repository,
   head branch, and intended base; never match a title alone. Include closed and merged PRs when
   reconciling a prior attempt. An unavailable or incomplete lookup is unknown, not evidence that
   no PR exists. After an uncertain publication result, repeat that read before retrying creation.
   Resolve ambiguity before writing.
   Read the live issue status and blockers. A canceled issue or closed unmerged PR blocks
   delivery. Never silently reopen terminal work. If the matching PR is already merged, skip
   implementation, planning, starting, and review; continue with step 6. A completed issue
   without matching merge evidence blocks this workflow rather than restarting it.
3. **Prepare missing implementation.** Before dispatch, read
   `${CLAUDE_PLUGIN_ROOT}/shared/agent-runtime-map.md` (using the resolved `PLUGIN_ROOT` outside
   Claude Code) and resolve `linear-devotee:issue-context` for the active runtime with isolated
   task-local inputs: issue id, repository root, and
   `NEEDS_STATUS_METADATA: true`. Reuse current raw records and retain exact Acceptance and
   decision sources. Missing blocker data is unknown; unresolved prerequisites, contradictory
   Acceptance, or consequential product decisions stop the dependent work. Use the existing
   task-linked workspace and issue branch. In Superset, workspace setup belongs to Maestro;
   do not create a replacement workspace or switch its branch in place. Outside Superset,
   the delivery request permits preparing the issue feature branch while preserving user work.
   Base branch, detached HEAD, unrelated changes, or another active writer require resolution
   before delivery writes. Apply the started transition in `../../shared/issue-lifecycle.md`;
   already-started work continues unchanged, including a coordinator's reservation.
4. **Plan, implement, and verify missing work.** Never invoke `greet`: its fresh-session trigger
   is unsuitable for resumed delivery. Pass the current brief, existing plan, source paths,
   caller authority, any shared-verification ownership and handoff constraints, and any
   existing PR to `linear-devotee:plan`. Preserve those caller constraints throughout
   implementation and verification. The plan reviews its
   decisions, then carries the requested implementation through applicable repository checks
   and a scoped commit. It creates a draft PR only when no matching PR exists. It returns
   control here after that handoff. Preserve valid completed tasks; an existing PR or started
   status alone does not prove Acceptance. If the existing PR already contains the complete
   verified implementation, reuse its current plan/evidence and proceed to finishing the PR.

   **REQUIRED SUB-SKILL:** Use `linear-devotee:plan` when implementation or its reviewed plan is missing.

5. **Finish the existing PR.** Supply its URL, expected repository/head/base, current head,
   scoped unpublished commits if any, verification evidence, and full-delivery authority.
   `git-gremlin:finish-pr` owns runtime-native review, fixes, external comments, fresh CI and
   required approval checks, and protected merge. Do not add a separate reviewer agent or infer
   review completion from a process exit code. Its `waiting` or `blocked` result returns here
   with the same PR and exact missing condition. A changed head requires refreshed evidence.

   **REQUIRED SUB-SKILL:** Use `git-gremlin:finish-pr` for the existing unmerged PR.

6. **Reconcile Linear completion.** Require an observed `merged` result with actual merge
   timestamp and commit, or freshly inspect an already-merged matching PR on resume. Verify it
   belongs to this issue's delivered scope; a source change that invalidates that scope needs
   a decision. Apply the completion transition in `../../shared/issue-lifecycle.md` and read
   back the actual team state. If Linear fails after merge, retain the PR and return the missing
   status reconciliation; the next invocation resumes here from fresh observations.

## Delegation and continuity

The issue owner may use a small bounded team for independently useful investigation or
implementation. Give each worker exact file or module ownership, tell it other agents are
working, and require observed results. Avoid concurrent writers to the same files and nested
teams that duplicate the owner. Review integration after meaningful changes before progressing
to the next functional block; final code review still uses the active runtime's native command.

Keep one optional disposable `.nuthouse/<ISSUE_ID>/progress.md` only when needed to survive
compaction. Before writing, check `git ls-files -- .nuthouse/<ISSUE_ID>/progress.md`; never
repurpose a tracked file as this ledger. Verify it is ignored with
`git check-ignore --quiet -- .nuthouse/<ISSUE_ID>/progress.md`. If it is not, resolve this
repository's local exclude file with `git rev-parse --git-path info/exclude`, read it, and append
`/.nuthouse/` on its own line while preserving existing entries. Do not edit tracked `.gitignore`.
Repeat `git check-ignore` before creating the ledger; if exclusion cannot be confirmed, omit
the optional ledger and report that continuity limit. Never include it in the delivery commit.

Its first line is `# ledger — issue: <ISSUE_ID>`. Record the authorized scope, workspace/branch,
PR, source/plan paths, outstanding question, and next action. Give each completed step one line
with its observed result and the check command or evidence location needed to revalidate it.
Re-read actual Linear, Git, and PR state on resume; the ledger is a reminder, not evidence of
approval, clean checks, or completed work. No Claude environment variables or greet cache are
required. If a tool, provider, or required skill is unavailable, report that limit and preserve
the recoverable work instead of inventing success or bypassing its validation.

Pause dependent work for a consequential question and include the exact question, options,
recommended choice when justified, and the stage its answer unlocks. When a supervisor or caller
relies on progress reads, emit those details as ordinary assistant output before invoking a
native question tool; its arguments may be absent from the supervisor's transcript. Continue
independent work while the answer is pending. After three failed correction rounds for the same
unresolved cause, return the concrete blocker. Pending external CI, approvals, or a merge queue
return `waiting`; do not spin indefinitely or treat waiting as completion.

## Report

Use the caller's result envelope when supplied; otherwise report this compact shape:

```text
outcome: done | waiting | blocked
issue: <id and URL>
workspace: <current path>
pr: <URL | none>
stage: <observed current stage>
evidence: <actual verification, merge and Linear state observations>
next_action: <pending event, recovery step, or none>
question: <actionable decision if needed | none>
```

`done` requires both the observed merge and correct Linear completion. An open PR, configured
auto-merge, a queued merge, closed review threads, or a silent terminal never satisfies it.
Keep merged-but-incomplete Linear status explicit. Do not delete the workspace, branch, or
another agent's session as a completion side effect.
