# git-gremlin

![git-gremlin](./assets/banner.png)

Review-comment discipline, commit, and PR helper for Claude Code and Codex.

It recognizes commit or PR intent, drafts the boring text from the current git state, stages
dirty changes when an actual commit needs them, and publishes local branches as draft PRs
after the PR confirmation gate. When `linear-devotee:plan` chains to `commit` and `pr` after a
verified implementation, that chain is the approval and the draft PR opens without asking. Code review itself belongs to the runtime's native reviewer; verification
belongs to hooks and CI. When a source spec or issue Acceptance is available, PR
preparation invokes Acid Prophet to check local changes and the committed PR payload
for drift. Workspace orchestration stays outside Git Gremlin.

## Skills

| Skill                                | Purpose                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `git-gremlin:commit`                 | Commit a staged selection, or stage dirty changes when no selection exists  |
| `git-gremlin:handle-review-comments` | Push before announcing a fix; reply, then resolve every refused comment     |
| `git-gremlin:pr`                     | Draft a PR, then publish the branch and create it as a draft after approval |

`handle-review-comments` is an ambient discipline, not a triage workflow. It never decides
whether feedback is valid, and it orders no `git commit` or `git push` of its own. It adds
two laws to whatever workflow the acting agent already has. A reply announcing a fix must
not precede the push of that fix: until the code is on the remote, the thread would be
claiming a correction no later agent and no human reader can see. And every comment the
agent excludes, judges invalid, rules out of scope, or otherwise refuses to act on receives
an explanatory reply and is then resolved, as part of completing the task.

## Agents

None. Commit and PR drafting run directly in their skills so the approval context and Git
permissions stay in one place.

## Install

Claude Code:

```text
/plugin marketplace add g-bastianelli/nuthouse
/plugin install git-gremlin@nuthouse
```

Codex CLI:

```text
codex plugin marketplace add g-bastianelli/nuthouse
```

Then open `/plugins` and install `git-gremlin`.
