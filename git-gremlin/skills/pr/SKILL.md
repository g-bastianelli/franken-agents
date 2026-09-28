---
name: pr
description: Publish the branch and open a draft GitHub pull request from branch history, or push to the branch's open PR. Use automatically after the commit that closes a finished task on a feature branch. Not for commits, status/diff/log, push-only, rebase, or non-GitHub merge requests.
effort: medium
allowed-tools: Bash(git log:*), Bash(git branch:*), Bash(git diff:*), Bash(git rev-parse:*), Bash(git remote:*), Bash(git config:*), Bash(git push:*), Bash(gh auth status:*), Bash(gh repo view:*), Bash(gh pr view:*), Bash(gh pr create:*), Read
---

# git-gremlin:pr

Draft, publish, open as draft. Match the user's language; keep technical identifiers unchanged.

## Voice

Read `../../persona.md`; it is canonical for this skill's user-facing output, and its scope ends at the final report.

## Context

> Auto-injected on Claude Code at skill load. If the line below still shows a raw,
> unexpanded dynamic-context command, run it manually before step 1.

- Branch: !`git branch --show-current`

## Workflow

1. Check the minimum preconditions.
   - Verify `gh` is available and authenticated with `gh auth status`.
   - Infer the base branch with `gh repo view --json defaultBranchRef`, falling back to
     `main`.
   - Stop on a detached `HEAD`, when the current branch is the base branch, or when no
     commits exist ahead of the base.
   - Capture the current branch and `HEAD_OID = git rev-parse HEAD`.
   - Run `gh pr view "<BRANCH>" --json url,state`. When it reports an `OPEN` PR, this run
     only publishes new commits to it: skip steps 2–3, then push, verify, and report that
     PR's URL instead of creating one.
   - If an authoritative spec or issue Acceptance is available in the delivery context
     or `docs/acid-prophet/specs/`, resolve the applicable source and run the checkpoint
     below before drafting. An ambiguous source needs clarification. No source means
     drift assessment is unavailable, not a reason to invent requirements.

   **REQUIRED SUB-SKILL:** Use `acid-prophet:check-drift` when available, with the source,
   inferred base, and intended PR scope. Check `worktree` and `committed` separately.
   Follow its plugin's `shared/development-drift.md` for findings and existing repair
   authority. Do not publish with unresolved drift or ambiguous findings. Local fixes
   must enter HEAD through an authorized commit workflow before clearing committed drift.
   If the skill is unavailable, disclose that limitation without claiming a clean result.
   After any authorized repairs, refresh branch and `HEAD_OID` before drafting.

2. Read `git log <base>...HEAD --oneline` and `git diff <base>...HEAD`. Detect Linear
   issue ids with `/\b[A-Z][A-Z0-9]+-[0-9]+\b/`, preferring the branch, then the log, then
   the diff. When exactly one id is unambiguous, suffix the title with ` [<id>]`; when
   several ids remain ambiguous, add no suffix. Draft an imperative title no longer than
   72 characters including any Linear suffix, preserving a useful conventional type or
   scope from the commits. Draft a body with `## Summary` and one to three bullets, then
   `## Test plan` with a checklist, then `Closes <id>` on its own line when one unambiguous
   Linear id was detected. Do not invent changes or verification absent from the inputs.
3. If the user asked only for PR text, display it and stop. Otherwise proceed without a
   confirmation gate: the PR is always opened as a draft, and the user marks it ready for
   review on GitHub.
4. Resolve the push remote in this order: `branch.<BRANCH>.pushRemote`,
   `remote.pushDefault`, `branch.<BRANCH>.remote`, `origin`, then the sole configured remote.
   Stop if the result is local (`.`), missing, or ambiguous.
5. Run `git push --set-upstream "<REMOTE>" "HEAD:refs/heads/<BRANCH>"`. Never force-push.
   `--set-upstream` is what leaves the branch with an upstream: it is silently ignored on an
   OID refspec, and `push.autoSetupRemote` only covers a push with no refspec, so a branch
   pushed either of those ways has none and tooling that maps a branch to its PR finds
   nothing. If the push fails, surface stderr verbatim and do not retry or create the PR.
6. Verify what actually landed: `git rev-parse "<REMOTE>/<BRANCH>"` must equal `<HEAD_OID>`.
   On mismatch, stop without creating the PR and report both OIDs — the remote holds
   something other than the drafted branch.
7. Unless an open PR already exists, run
   `gh pr create --draft --head "<BRANCH>" --title "<TITLE>" --body "<BODY>" --base "<BASE>"`,
   passing every value as a separately quoted argument without `eval`. If it fails,
   surface stderr verbatim and do not retry. On success, capture the PR URL from stdout.

Hooks and CI own test execution; the source comparison above is the pre-PR drift checkpoint.
This skill does not run test suites, merge the PR, update issue or
project state, orchestrate follow-up work, or infer human acceptance unless the user asks for
that work separately.

## Final Report

```text
git-gremlin:pr report
  PR:     <url> (draft | existing, updated)
  Title:  <pr title>
  Base:   <base branch>
  Branch: <branch> published via <remote>
```

## Never

- Push or create anything when the user asked only for PR text.
- Create a PR that is not a draft, or a second PR for a branch that already has an open one.
- Push the base branch, force-push, or choose between ambiguous remotes.
- Retry silently after `git push` or `gh pr create` failure.
- Run test suites, merge, update external issue state, or invoke unrelated workflows unless
  the user asks separately. The conditional drift checkpoint above is part of PR preparation.
