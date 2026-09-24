# Concierge fail-closed (missing model key) @375

Fixture path: `/test-login` → **Alex Rivera — coach unavailable (no model key)**.

| File | What it shows |
| --- | --- |
| `a-coach-unavailable-375.png` | Coach home: unavailable empty state, disabled chips + Ask |
| `b-sheet-unavailable-375.png` | Vault FAB → bottom sheet with the same unavailable state |

Regenerate (dev server on port 3000):

```bash
node scripts/capture-concierge-fail-closed-proof.mjs
```

E2E: `npx playwright test e2e/concierge-fail-closed.spec.ts`
