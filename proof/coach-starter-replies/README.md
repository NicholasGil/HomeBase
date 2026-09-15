# Coach first-session starter replies (375px)

Fixture path: `/test-login` → **Discovery coach — Alex Rivera (no property)** → `/coach`.

## What each PNG shows

Captured **after** the server action returns and the explain-only reply bubble is in the DOM:

1. Tap a locked first-session chip.
2. Wait for `[data-testid="concierge-answer"][data-kind="answer"]` inside `concierge-first-session-thread`.
3. Assert scoped Discovery-empty copy (see `e2e/coach-starter-replies.spec.ts`).
4. Screenshot the viewport (375×812).

Each image shows **chips + visible answer bubble + Ask** with ≥16px clearance above the tab bar. SHA256 hashes of the three files must differ.

## Auth (Clerk / fixture)

- **Fixture non-buyer** (agent/vendor test cookie): `askConcierge` → `FORBIDDEN` (no facts).
- **Clerk Path B**: `clerkBuyerConciergeFacts()` loads Convex `me.getSession` (buyer only), derives discovery-empty from dashboard/coach scope (no client flag), then returns discovery-empty facts or `concierge.gatherContext` (`src/lib/concierge-clerk-buyer.ts`, `src/app/actions/concierge.ts`).

| File | Starter |
| --- | --- |
| `starter-what-happens-next-375.png` | What happens next? |
| `starter-what-am-i-missing-for-this-stage-375.png` | What am I missing for this stage? |
| `starter-whats-already-on-my-file-375.png` | What's already on my file? |

Regenerate: `npx playwright test e2e/coach-starter-replies.spec.ts`
