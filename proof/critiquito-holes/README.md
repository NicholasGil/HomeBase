# Critiquito design holes proof (@375×812)

Source: Design Manager queue `design-holes-queue-2026-09-15-post56.md` (main `c3bf404`).

Regenerate: `npm run test:e2e -- e2e/critiquito-holes-proof.spec.ts`

| File | Hole IDs | What it proves |
| --- | --- | --- |
| `pricing-fold-hierarchy-375.png` | PRICING-HIER-001 | `/pricing` fold: `$10/mo` hero dominates; locked upsell cards are bullets-only. |
| `pricing-upsell-section-375.png` | PRICING-HIER-001 | Locked upsell group + **one** shared “No payment…” disclaimer (not per card). |
| `coach-discovery-fold-375.png` | COACH-FOLD-001, LOCK-CHROME-001 | Discovery empty fold: no ellipsis greeting; chips + Ask readable; collapsed “Full OS locked” summary (no four rail cards @375). |
| `coach-file-session-lock-summary-375.png` | LOCK-CHROME-001 | File session @375: same quiet lock summary + softer tab lock marks. |
| `coach-discovery-starter-reply-375.png` | COACH-FOLD-001 | Post-tap: starter answer readable between chips and Ask. |
| `pricing-fab-tab-clearance-375.png` | HB-FEEL-002 (closed #55) | FAB ≥16px above tab bar — measure only, no change. |

## Fixed this PR

| ID | Fix |
| --- | --- |
| PRICING-HIER-001 | Shared `pricing-locked-os-disclaimer`; upsell cards bullets-only on `/pricing`. |
| LOCK-CHROME-001 | Quieter tab lock icons; coach rail collapses to `locked-upsell-rail-summary` below `md`. |
| COACH-FOLD-001 | Shorter Discovery header/empty copy; tighter chips; no mid-fold greeting clip. |

## Skipped (with reason)

| ID | Reason |
| --- | --- |
| FAB-VISUAL-001 | Clearance OK (#55); coach/pricing hierarchy pass did not require FAB visual change — measure note in clearance PNG. |
| HB-FEEL-003 / V-003r | Optional per queue — not live on buyer path. |
| NV-001r / NV-002r / HB-FEEL-002 / AUTH-COPY-001 / #54 / #56 | Closed — not touched. |
