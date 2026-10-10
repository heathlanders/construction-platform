#!/usr/bin/env bash
# PreToolUse guard: when a web/mobile UI file is edited, inject a reminder to follow
# DESIGN.md. No output (= no-op) for non-UI files.
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  */web/src/*.tsx|*/mobile/src/*.tsx|*/web/tailwind.config.ts|*/web/src/lib/colors.ts|*/mobile/src/lib/theme.ts|*/mobile/src/lib/theme-context.tsx)
    cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"UI file edit — follow DESIGN.md. Guardrails: status colors ONLY from the canonical map (web lib/status.ts / mobile theme.ts) — never per screen; incident severity + trade colors ONLY from canonical sources (mobile theme.ts / web/src/lib/colors.ts); on web build from the @/components/ui kit + semantic tokens (bg-surface/text-ink/text-muted/border-line, @/components/charts) — no raw semantic hex and no raw bg-white/gray-* on new/migrated screens; field-facing body text >=16px; mobile tap targets >=48px; contrast >= WCAG AA; flat surfaces (shadow only on overlays); respect light/dark/system (web theme-provider.tsx, mobile theme-context.tsx); land changes in BOTH web and mobile or state why one is out of scope. Read DESIGN.md if you haven't this session."}}
JSON
    ;;
esac
