# Observe GitHub before merge

Use direct `gh` commands. These are observations; the acting agent owns finding dispositions and
the entrypoint's merge boundary. Substitute verified values as separate arguments, without `eval`.

## PR and CI

```text
gh pr view <PR-URL> --json url,state,isDraft,headRefOid,baseRefOid,headRefName,baseRefName,headRepository,headRepositoryOwner,mergeable,mergeStateStatus,reviewDecision,mergedAt,mergeCommit
gh pr checks <PR-URL> --json name,state,bucket,link
```

`gh pr checks` fetches all status-check pages. Read the JSON buckets and actual states; a
successful JSON command may contain failing checks. `pass` is successful, `pending` waits,
`fail`/`cancel` need a supported repair, and `skipping` must be a completed conditional skip.
All-skipped or missing CI does not establish successful verification. Unknown states or an
API/parse/authentication failure leave evidence unavailable.

The observed checks alone cannot prove that an expected required check exists. Require GitHub's
current `MERGEABLE` plus `CLEAN` (or `HAS_HOOKS`, where server hooks still decide) and a satisfied
review decision. `BLOCKED`, `BEHIND`, `DIRTY`, `DRAFT`, `UNKNOWN`, and `UNSTABLE` are not permission
to merge. Use `gh pr checks <PR-URL> --required --json name,state,bucket,link` to inspect required
checks when diagnosing a restriction. An empty required-check report never overrides GitHub's
blocking decision. Approval requirements, permitted actors, queue rules, and other restrictions
remain enforced by the normal server-side merge path.

Check `isDraft` independently: a draft can still report `CLEAN`. Only the authorized owner marks
it ready after completing the review and local verification.

## All threads and outstanding reviews

Set `OWNER`, `REPO`, and `NUMBER` to the verified base repository and PR number. For a GitHub
Enterprise host, pass the matching `--hostname` to each `gh api` call. Paginate the two connections
separately so their independent cursors cannot hide later results:

```sh
gh api graphql --paginate --slurp -f owner="$OWNER" -f name="$REPO" -F number="$NUMBER" -f query='
query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      headRefOid baseRefOid isInMergeQueue isMergeQueueEnabled
      reviewThreads(first: 100, after: $endCursor) {
        totalCount pageInfo { hasNextPage endCursor }
        nodes { id isResolved isOutdated path line }
      }
    }
  }
}'
```

```sh
gh api graphql --paginate --slurp -f owner="$OWNER" -f name="$REPO" -F number="$NUMBER" -f query='
query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      headRefOid baseRefOid
      latestOpinionatedReviews(first: 100, after: $endCursor) {
        totalCount pageInfo { hasNextPage endCursor }
        nodes { id state url }
      }
    }
  }
}'
```

Require complete page traversal, matching totals, no partial GraphQL errors, and unchanged PR
head/base across pages and the final PR refresh. Every unresolved thread counts, including an
outdated one. Read full paginated comments for affected threads when repairing them; thread
metadata is insufficient to judge feedback. Read ordinary PR comments and review bodies too.

`REVIEW_REQUIRED` waits for the required reviewer. `CHANGES_REQUESTED` in GitHub's decision or
any latest opinionated review remains a blocker even when threads are resolved. `APPROVED`
cannot clear an unresolved thread. A null review decision (an empty string in `gh pr view` JSON)
may mean no required approvals; do not
invent one, and do not infer successful native code review from it.

An open PR in the merge queue is `waiting`. A queue admission or auto-merge response is never
completion. After the merge request, reload state, `mergedAt`, and `mergeCommit`; only the actual
merged state with those fields supports the `merged` outcome.

References: [Checks CLI](https://cli.github.com/manual/gh_pr_checks),
[checks pagination implementation](https://github.com/cli/cli/blob/trunk/pkg/cmd/pr/checks/checks.go),
[GraphQL pagination](https://cli.github.com/manual/gh_api),
[PR review and merge states](https://docs.github.com/en/graphql/reference/pulls),
[protected merge command](https://cli.github.com/manual/gh_pr_merge).
