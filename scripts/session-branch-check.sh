#!/usr/bin/env bash
# SessionStart hook — enforce branch-per-feature.
# One feature = one branch. Warn when on a shared base branch so a new feature gets its own.
# Output is injected as session context (the assistant reads it and prompts the user).

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

case "$branch" in
  main|master|develop)
    echo "BRANCH GUARD: on shared base branch '$branch'."
    echo "Before any code change for a NEW feature: DERIVE a kebab-case branch name from the user's request and PROPOSE it (e.g. request 'add a what's new popup' -> feat/whats-new-popup), then on their OK create it: git checkout -b feat/<name>. Auto-suggest — don't ask blankly. One feature = one branch. Only edit directly on '$branch' for tiny doc/config tweaks the user explicitly approves."
    ;;
  *)
    echo "BRANCH GUARD: on feature branch '$branch'."
    echo "If this session's request is a DIFFERENT/unrelated feature, DERIVE + PROPOSE a kebab-case branch name from the new request and offer to start fresh: git checkout main && git pull && git checkout -b feat/<name> — don't pile unrelated work onto '$branch'."
    ;;
esac
