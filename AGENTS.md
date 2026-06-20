# Hansard Dashboard Agent Rules

This repository contains the public-facing frontend for the Sri Lankan Hansard topic modeling project.

Read `.rules/frontend-product.rules.md` before making product, UX, visual, content, or interaction changes.

## Hard Requirements

- Do not turn this product back into a generic analytics dashboard.
- Keep the app as a public-facing civic research explorer.
- Preserve the primary routes: `/`, `/topics`, `/timeline`, `/speeches`.
- Keep multilingual support visible and working.
- Keep topic colors consistent across all views.
- Keep the Overview page story-first, not chart-first.
- Keep the Topic Atlas as the flagship exploration surface.
- Keep the Speech Explorer evidence-driven, not table-driven.
- Do not add unsourced real-world event claims.
- Any topic-to-event links must be explicit, dated, and source-backed.

## Source of Truth

Use these in order:

1. `.rules/frontend-product.rules.md`
2. current app structure and routes
3. existing static data contracts under `public/data`

If implementation ideas conflict with the rules file, the rules file wins unless the repo owner updates it.
