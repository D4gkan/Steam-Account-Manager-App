## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-role triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See `docs/agents/domain.md`.

### Browser-engine work

Before changing browser sessions, session isolation, navigation policy, or extension
support, read `CONTEXT.md`,
`docs/adr/0001-adopt-geckoview-for-csfloat.md`, and
`docs/verification/geckoview-csfloat-prototype.md`.

The GeckoView migration is tracked by GitHub issue #3 and its dependency-linked
implementation issues. Production migration work must not start until the
compatibility gate records a `GO` decision.
