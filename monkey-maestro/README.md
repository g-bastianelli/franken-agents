<p align="center">
  <img src="assets/banner.png" alt="monkey-maestro" width="680" />
</p>

# monkey-maestro

The orchestra obeys the banana. Give Maestro an authorized Linear project and it
supervises one isolated Superset workspace per issue, using Codex or Claude Code.

`linear-devotee:deliver` owns each issue's context, plan, implementation, verification,
draft PR, native runtime review, corrections, protected merge, and observed Linear
completion. Maestro follows progress, relays questions, and starts newly unblocked issues
without asking the user to repeat every workflow command.

Read the [operating guide](USAGE.md) for launch examples, review and merge conditions,
questions, recovery, and stopping a run.

## Project supervision

Linear is the sole scheduling authority. Every started issue occupies one concurrency
slot, including work started elsewhere or waiting for a decision. Candidates are selected
in stable identifier order only when every current blocker is terminal. Unknown facts
never become ready facts.

The supervisor creates a workspace, verifies its exact task/branch binding, reserves the issue as started,
then rereads the project and control before launching. A reused workspace is inspected;
it never causes a duplicate launch. One active supervisor per run is a precondition;
an active control does not identify that owner. Another session needs observed stopped-owner
evidence or an explicit handoff before starting supervision. Linear's ordinary
status writes are not locks, so independent concurrent writers cannot be given a global
transactional concurrency guarantee. Superset's reuse decision is branch-based, not an
atomic per-task lock; ambiguous creation or missing identity readback prevents launch.

Issue leads can use bounded specialists when useful. They retain integration ownership
and use Codex's or Claude's native reviewer. Required approvals, fresh checks, resolved
review findings/threads, and repository protections still govern merge. Enabling
auto-merge or entering a merge queue is pending work. Completion requires observed merge
and a completed Linear status readback; a quiet terminal proves neither.

Supervision runs while the current agent session is active. It reads Superset terminals
and provider transcripts, sends answers to the existing worker, and refills capacity from
fresh Linear observations. It checkpoints when external decisions or unavailable transport
prevent progress. Closing the supervisor stops supervision; an active control does not
run a daemon. Scheduled Superset automation requires a separate explicit request.

## Skills

| Skill                        | Responsibility                                                    |
| ---------------------------- | ----------------------------------------------------------------- |
| `monkey-maestro:status`      | Read control, Linear counts, and available capacity               |
| `monkey-maestro:start`       | Resolve transport, record full delivery scope, enter supervision  |
| `monkey-maestro:orchestrate` | Reserve, dispatch, observe, recover, and refill authorized issues |
| `monkey-maestro:spawn`       | Launch or recover one scoped issue or bounded quick fix           |
| `monkey-maestro:reconcile`   | Read-only inspection of task/workspace/session correlation        |
| `monkey-maestro:stop`        | Stop future dispatch and recovery; existing workers continue      |

## Scope and recovery

A schema-v3 control explicitly records `deliveryScope: issue-through-merge`, project,
run, workspace group, transport, concurrency, and revision. Only that validated authority allows the full
project workflow. Unsupported or incomplete controls require explicit activation. Control
comments remain append-only; they contain no private execution queue or copy of the graph.

Start presents the exact target and delivery scope once. Authorization carries through
plans, commits, PRs, review fixes, and protected merge. New product decisions, scope
changes, and missing required approvals remain questions for the user. A request to
inspect or draft a plan retains that narrower scope.

Manual issue spawn is independent of project controls and concurrency. An ordinary issue
launch keeps draft-PR scope; `--through-merge` or explicit caller authority selects full
issue delivery. Quick fixes use a deterministic `quick/<slug>-<digest>` branch and keep
edit/check scope. Recovery preserves the existing workspace, PR, and native provider
session when available. An uncertain launch is inspected before any second attempt.

Host/project/agent resolve from explicit values, usable control, then local discovery.
A stopped CLI daemon does not disqualify an online desktop host with successful read
probes. Linear tasks are resolved explicitly with `--tracker linear`, so the organization's
default tracker cannot redirect identity.

Each project run has its own Superset sidebar folder. Start records its readable
`workspaceGroup` once with the run; new issue workspaces receive that tag. Resuming the
same run from another conversation keeps the same folder, even after a project rename
or date change. Starting a new run chooses a new folder. Group readback verifies placement;
a missing run tag can be restored only on a workspace already proven to belong to that
run, with an unambiguous read of its existing tags. Ambiguous placement stays unchanged
and is reported. Groups never establish workspace ownership or issue readiness.
Manual spawn continues to inherit the invoking workspace's groups for new workspaces and
preserves existing placement on recovery.

Issue creation supplies the raw Linear UUID, its verified branch, and the repository's
target base explicitly, then reads back task/branch association. Setup terminals returned
by that exact creation are inspected for readiness; their shells can remain alive after
setup ends. Unknown live sessions still prevent launch. A failed setup step is reported
and assessed against actual repository prerequisites before any worker starts.

## Development

```text
bun test monkey-maestro/
bun run test:meta
bun run check:skills
bun run check:runtime
bun run check:workflow
```

Control tests exercise authority parsing and successor writes. Workflow behavior is
evaluated with the [delivery scenarios](evals/delivery.md) in both runtimes; static tests
do not prove a Superset session, native review, or merge actually worked.

## Install

```text
/plugin install monkey-maestro@nuthouse
codex plugin install monkey-maestro@nuthouse
```

## License

MIT
