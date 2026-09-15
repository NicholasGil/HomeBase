# Design holes proof (@375×812)

Captured via `e2e/design-holes-proof.spec.ts` (fixture buyer, mobile viewport).

| File | Hole IDs | What it proves |
| --- | --- | --- |
| `coach-type-radius-fab-clearance-375.png` | NV-001, NV-002, HB-FEEL-002 | Discovery-empty `/coach`: pack type tokens on coach header (`text-h2`, `text-body`, `text-eyebrow`), card radius `rounded-2xl` (16px ladder), no concierge FAB on coach home, sticky Ask row clears the tab bar (≥16px). |
| `pricing-type-radius-fab-clearance-375.png` | NV-001, NV-002, HB-FEEL-002 | `/pricing` fold: `text-display` hero, `text-h2` CTA section, `rounded-2xl` cards, concierge FAB sits fully above the mobile tab bar (≥16px clearance). |

**HB-FEEL-003:** not pictured — Save/Dislike on search already use `Button` `size="sm"` (`min-h-11` / 44px); locked buyer routes do not expose sub-44 controls in fixture mode.
