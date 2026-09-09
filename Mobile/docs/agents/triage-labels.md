# Triage Labels

The skills speak in terms of two category roles and five state roles. This file
maps those roles to the actual label strings used in this repo's issue tracker.

## Category labels

Every triaged issue carries exactly one category label.

| Label in mattpocock/skills | Label in our tracker | Meaning                    |
| -------------------------- | -------------------- | -------------------------- |
| `bug`                      | `bug`                | Existing behavior is broken |
| `enhancement`              | `enhancement`        | New behavior or improvement |

## State labels

Every triaged issue carries exactly one state label.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (for example, "apply the AFK-ready triage label"),
use the corresponding label string from these tables.

Edit the right-hand column to match whatever vocabulary you actually use.

## Tracker capability fallback

If the authenticated GitHub account cannot create or apply a configured state label,
write both canonical roles in the issue body:

```markdown
## Category

enhancement

## Status

ready-for-agent
```

Use `bug` or `enhancement` for `## Category` and one of the five state roles for
`## Status`. Flag the missing labels for a repository administrator. Do not silently
substitute a different label or omit either role.
