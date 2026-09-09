# Issue tracker: GitHub

Issues and PRDs for this repo live in
`D4gkan/Steam-Account-Manager-App` as GitHub issues. Use the `gh` CLI for all
operations.

This checkout is a fork-based workflow:

- `upstream` is the canonical repository: `D4gkan/Steam-Account-Manager-App`.
- `origin` is the contributor fork: `AltanEsmer/Steam-Account-Manager-App`.
- Issue operations must specify `--repo D4gkan/Steam-Account-Manager-App` so they
  cannot accidentally target the fork.
- Feature branches are pushed to `origin`; pull requests target `upstream/main`.

## Conventions

- **Create an issue**: `gh issue create --repo D4gkan/Steam-Account-Manager-App --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --repo D4gkan/Steam-Account-Manager-App --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --repo D4gkan/Steam-Account-Manager-App --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo D4gkan/Steam-Account-Manager-App --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo D4gkan/Steam-Account-Manager-App --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo D4gkan/Steam-Account-Manager-App --comment "..."`

Do not rely on automatic repository inference for tracker writes: the checkout has
both fork and upstream remotes.

## Pull requests

Push the scoped branch to `origin`, then create the pull request explicitly against
the canonical repository:

```bash
git push -u origin <branch>
gh pr create \
  --repo D4gkan/Steam-Account-Manager-App \
  --base main \
  --head AltanEsmer:<branch>
```

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create an issue in `D4gkan/Steam-Account-Manager-App`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo D4gkan/Steam-Account-Manager-App --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies** — the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only — the live gate). Where dependencies aren't available, fall back to a `## Blocked by` section containing one `- #<n>` entry per blocker, or `None — can start immediately.` A ticket is unblocked when every referenced blocker is closed.
- **Decision gates**: a gate that completes with `GO` may close and unblock its dependants. A gate that records `NO-GO` remains open as a blocking sentinel with `## Status` set to `needs-info`; it must not close and accidentally expose downstream work to the frontier.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue referenced in its `## Blocked by` section) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
