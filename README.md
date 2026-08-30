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

## P1

M1 journey roadmap: org-configurable stages, blocking tasks hold stage advance, transitions append to auditLog. Seeded mid-flight buyer (Alex Rivera, inspection) passes the ten-second test.

M2 document vault: upload/classify, grants with scope and expiry, immediate revoke. Every open goes through documentGrants or a transaction principal check inside Convex. A lender granted the preapproval cannot load the inspection report by id.

M3 concierge: `lib/llm/` is the only model path. Prompts live in `lib/llm/prompts/`. Answers are scoped to one transaction, PII is redacted first, and dollar figures must already exist on the file with provenance.

## P2

M4 showing scheduler: buyer picks sample listings and hits Build My Tour. The optimizer accounts for listing windows, appointment length, fixture drive times, buyer/agent windows, and buffers. Removing a stop re-optimizes the remainder. Post-showing verdicts write to `showingFeedback`.

There is no production Routes API key in this repo. Local and CI use the named fixture distance path. Vercel production without `GOOGLE_MAPS_ROUTES_API_KEY` fail-closes. That credential stays on needs-human #1.

## P3

M5–M7 offer center, cost simulator, and contract explainer. Seeded offers stay draft until a licensee reviews them. Every figure carries provenance. Explainer describes only.

## P4

M8 agent command center: Casey Holt's eight assigned clients, stage at a glance, and a daily list that puts exception files first. Buyers and vendors cannot load `/agent`. Flags stay off.
