# HomeBase

Buyer-side operating system for one brokerage and one market. A buyer should open the app and, within ten seconds, know where they are, what is done, what is next, who they are waiting on, and what they owe today.

`docs/DESIGN.md` is the source of truth.

## Stack

Next.js 16 App Router, TypeScript strict, Tailwind, shadcn/ui. Convex and Clerk land in the next two P0 slices.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
```

CI runs lint, typecheck, and unit tests on every pull request.

## Feature flags

`FLAG_MLS`, `FLAG_VENDOR_COMP`, `FLAG_ESIGN`, and `FLAG_IDV` exist and default off. Do not flip them.

## P0

1. This scaffold.
2. Convex schema, seed, and permission tests.
3. Clerk, role routing, buyer dashboard, and transaction isolation.
