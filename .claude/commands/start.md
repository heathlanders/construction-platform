# /start

Session startup routine. Run this at the beginning of every Claude Code session.

## Usage
```
/start
```

## Steps

1. Read CLAUDE.md (root)
2. Read docs/PROJECT_MASTER_REFERENCE.md — specifically:
   - Open Questions (note any new questions to resolve today)

3. Load on-demand reference files as needed:
   - `docs/LOCKED_DECISIONS.md` — before any architectural decision (confirm nothing has changed)
   - `docs/CHANGE_LOG.md` — what changed since last session / session summaries
   - `docs/KEY_NUMBERS.md` — pricing, revenue targets, unit economics
   - `docs/GLOSSARY.md` — platform terminology

4. Check git status:
   ```bash
   git status
   git log --oneline -10
   ```
   Report: current branch, any uncommitted changes, last 10 commits.

5. Ask: "What are we building today?"
   Then use /plan before starting any implementation work.

## Reminder checklist (print at start of every session)
- [ ] Using /plan before any task touching >2 files?
- [ ] Running /compact at 50% context usage?
- [ ] Using `ultrathink` for security/RLS/cross-tenant decisions?
- [ ] Committing after every completed task?
- [ ] Running /rls-audit before any PR?
