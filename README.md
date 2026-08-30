# HomeBase

Buyer-side operating system for one brokerage and one market. A buyer should open the app and, within ten seconds, know where they are, what is done, what is next, who they are waiting on, and what they owe today.

`docs/DESIGN.md` is the source of truth.

## Stack

Next.js 16 App Router, TypeScript strict, Tailwind, shadcn/ui, Convex, Clerk.

Convex functions live in `convex/`. `npx convex codegen` writes `convex/_generated`. Seed, permission, and isolation tests run in `convex-test` without a cloud project. Clerk and a hosted Convex project are needs-human. Until those exist, `/test-login` starts a fixture buyer session. Production ignores that cookie.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

CI runs lint, typecheck, unit tests, and the P0 Playwright job on every pull request.

## Feature flags

`FLAG_MLS`, `FLAG_VENDOR_COMP`, `FLAG_ESIGN`, and `FLAG_IDV` exist and default off. Do not flip them.

## P0

1. Scaffold, flags, home page.
2. Convex schema, seed, and permission tests.
3. Clerk wiring, role routing, buyer dashboard, transaction isolation.
4. Playwright buyer login → dashboard, fixture auth, isolation by URL.
