# Development and PR drift

## Contents

- Resolve the source
- Collect the effective change
- Analyze drift
- Optional publication

## Resolve the source

Verify Git and choose `worktree` by default or `committed` for the actual PR payload. Prefer an
explicit readable spec, then supplied issue Acceptance.

An automatic checkpoint (a PR or implementation workflow, not the user asking) stops there or at
one exact match: a spec in `docs/acid-prophet/specs/` whose `linear-project`, project id, or issue
id matches the branch issue id. Anything else — no issue id, no match, several matches — returns
`skipped: no source` at once, without scanning further, asking, or loading Linear. Ad-hoc work is
not a drift failure; the report says the check was skipped, never that it was clean.

An explicit check also tries a close filename slug, may use the branch issue to resolve its
project and retry, and asks for the source when still missing or ambiguous. Once selected, a spec
remains primary over later Linear context.

From a spec, extract the active Acceptance section only, excluding history, plus Goal/Problem,
Solution, Constraints, Non-goals, and Edges. From Linear fallback, use a bounded read-only agent to
load project details and complete issue Goal/Acceptance/Constraints. Capture unresolved
`[NEEDS CLARIFICATION: ...]` markers with lines.

## Collect the effective change

Resolve base from `--base`, PR base, default branch, then existing `main`. Require a readable base
and merge base; failure is unavailable comparison, not clean.

Capture HEAD, short status, and merge-base-to-HEAD diff. In `worktree`, also inspect staged,
unstaged, and relevant untracked source/tests without modifying the index. Exclude secrets,
generated output, and unrelated user files; unreadable relevant data is missing evidence. Judge the
effective tracked state once and retain provenance so local corrections are not mistaken for
committed fixes.

In `committed`, use only merge-base-to-HEAD and files at HEAD. A local-only spec cannot bless older
committed behavior. Inspect source history and recorded decisions when requirements changed; do not
compare changed code only against changed expectations. No changes in scope is not full acceptance.

## Analyze drift

Split the criteria before dispatch. In scope: the Acceptance ids of the assessed block/issue —
named by the caller, else read from the supplied plan's Acceptance traceability or the `covers`
ids of the assessed deliverable's steps — cross-cutting constraints, and any other criterion whose
described behavior the changed files implement or touch. Everything else is `UNRELATED`, listed by
id with a one-line reason and no evidence search. With no ids from the caller or a plan, every
criterion is in scope. The plan only scopes the check; code is judged against the source, never
against the plan.

Dispatch one read-only agent with the in-scope criteria, the changed paths with their diff, and the
selected scope; it reads further files only to confirm specific behavior. For every in-scope
criterion return source path/id, classification, expected versus observed behavior, and file/line
evidence. An untouched in-scope criterion is not automatically clean. Assess regressions and
affected cross-cutting constraints; missing evidence inside scope is ambiguous.

Record counts, source version, base, HEAD, scope, and unresolved decisions. A clean result describes
only this comparison.

## Optional publication

Print findings inline and return them to the caller. Only an explicit publication request enables a
PR comment. Confirm the concrete comment unless already authorized, write it to a temporary file,
and call `gh pr comment --body-file`. Surface failures and offer manual copy; do not retry silently.
