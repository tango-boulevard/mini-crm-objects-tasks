# AGENTS.md

## Project purpose

Build a compact, secure mini CRM for construction objects and their tasks. The result is a hiring assignment, so correctness, explainability, security, and reproducibility take priority over feature count and visual polish.

## Sources of truth

1. `docs/SPECIFICATION.md` defines product behavior and acceptance criteria.
2. `docs/DECISIONS.md` records assumptions where the assignment is ambiguous.
3. `docs/ARCHITECTURE.md` and `docs/SECURITY.md` define technical boundaries once added.
4. Supabase migrations are the executable source of truth for the database.

If code and documentation disagree, stop and reconcile them in the same change.

## Non-negotiable security rules

- Authorization must be enforced by PostgreSQL RLS, not only by the UI.
- The client must never contain `service_role` or other privileged secrets.
- The client must not update a task status directly.
- Every status transition must go through the database function dedicated to transitions.
- Transition validation and history insertion must happen in one database transaction.
- Task status history is append-only for normal application users.
- Executors must not read or mutate tasks assigned to other executors.
- System-owned fields such as author, creation time, and history actor are not client-controlled.

## Engineering rules

- Use strict TypeScript; avoid `any` unless a documented integration boundary requires it.
- Keep feature logic close to its feature and shared infrastructure in `src/shared`.
- UI components do not call Supabase directly; use feature or entity data-access modules.
- Validate user-entered data at the form boundary and enforce critical invariants again in the database.
- Prefer explicit names and small modules over generic abstractions.
- Do not add features outside the specification without recording the decision.
- Never commit `.env`, access tokens, passwords, generated coverage, or build output.

## Required verification

For application changes, run the relevant checks before declaring a stage complete:

```text
typecheck
lint
unit tests
database policy and transition tests
production build
critical end-to-end scenarios when available
```

Every database policy must have at least one allowed and one denied test case.

## Documentation lifecycle

- Update `docs/DECISIONS.md` when resolving ambiguity.
- Update `docs/SECURITY.md` when an authorization boundary changes.
- Update `README.md` when setup commands or environment variables change.
- Keep `docs/SUBMISSION_CHECKLIST.md` aligned with the actual deliverables.

## Scope discipline

The first release excludes attachments, notifications, deadlines, full-text search, organization management, and public sign-up. These may be proposed after the required assignment is complete, but they must not delay the core submission.
