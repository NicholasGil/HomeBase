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

## P5

M10 vendor directory and portal. Inspection-stage buyers see inspectors with compare and request-appointment. Jordan Hale's portal is one assigned file, granted documents only, and access that ends on expiry. `compensationModel` writes other than `none` are rejected while `FLAG_VENDOR_COMP` is off. No payment flow. Flags stay off.

## P6

M11 e-signature and M12 identity. The app owns the Prepare → Explain (M7) → Agent Review → Buyer Review → Verify → Sign → Audit Trail → Storage → advance-stage workflow, plus the audit log and retention timestamp. The sandbox adapter never calls Dropbox Sign or DocuSign and never reads an API key. `FLAG_ESIGN` stays off; provider send/sign fail closed.

M12 tier 1 is device unlock. No face or biometric template is stored or sent. Tier 2 is vendor IDV for financial documents, designated execution, and recovery changes. `FLAG_IDV` stays off. The per-state table is empty until review. High-risk actions fail closed. Production keys stay on needs-human #1.

## P7

M9 conversational property search. A deterministic parser turns the canonical query (`4-bedroom under $450k, some land, good garage, ~20 minutes from town`) into structured criteria. Results are ranked sample listings, each with a stated reason. Saves, dislikes, tours, and M4 showing feedback change later rank order.

`FLAG_MLS` stays off. Search runs against manual/CSV seed inventory labeled sample data. The licensed-feed branch is closed and empty. This repo does not scrape listing sites and does not install an MLS/IDX client.
