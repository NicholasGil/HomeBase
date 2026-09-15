# Critiquito design holes proof (@375×812)

Regenerate: `npm run test:e2e -- e2e/critiquito-holes-proof.spec.ts`

| File | Hole IDs | What it proves |
| --- | --- | --- |
| `pricing-fold-hierarchy-375.png` | PRICING-HIER-001 | `/pricing` fold: `$10/mo` on `text-display` in the hero card dominates subdued locked upsell titles (`text-h3` / muted). |
| `coach-lock-chrome-rail-375.png` | LOCK-CHROME-001 | `/coach` Path B: shared sand lock icon + eyebrow on upsell rail; tab lock badges use the same chrome (not clipped @375). |
| `pricing-fab-tab-clearance-375.png` | HB-FEEL-002 (verified, no change) | `/pricing`: FAB remains ≥16px above the mobile tab bar — recaptured for this pass only. |

## Skipped this pass

| ID | Reason |
| --- | --- |
| HB-FEEL-003 | No sub-44 buyer controls on live paths (unchanged). |
| V-003r | Destructive Close ring not on buyer path (unchanged). |
| NV-003 / NV-005 | Live FAB wiring / flags out of scope per leader brief. |
| V-012 / D-001 | Held unless asked. |
