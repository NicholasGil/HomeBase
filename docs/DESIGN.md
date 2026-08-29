# HOMEBASE — BUILD SPEC

### Handoff document for Grok Bot agent team

**Repo:** homebase · **Commit to:** docs/DESIGN.md · **Owner:** Nicholas Gil

## 1. PRODUCT

**HomeBase is the operating system for buying a home.** It carries one buyer from "thinking about it" through closing and into homeownership, in one app, with an AI that understands their specific transaction.

**Scope of record:** buyer side, one brokerage, one market. Listing/seller side is out of scope for this build.

**Primary success test:** a buyer opens the app cold and within ten seconds knows — where am I, what's done, what's next, who am I waiting on, what do I owe today.

## 2. STACK

| Layer | Choice | Note |
| --- | --- | --- |
| Frontend | Next.js 16 App Router, TypeScript strict | |
| UI | Tailwind + shadcn/ui | |
| Backend + DB | Convex | reactive queries, TS server functions, file storage, cron, vector search |
| Auth | Clerk + Convex integration | |
| AI | Vercel AI SDK behind internal lib/llm/ wrapper | no provider SDK imported outside that dir |
| Routing/maps | Google Maps Routes API | drive-time matrix for tour builder |
| Email / SMS | Resend / Twilio | |
| Host | Vercel | |
| Deferred installs | Stripe, Dropbox Sign, Persona, MLS/IDX client | not installed before their phase |

Convex is chosen because permission logic lives in server functions in one place, and reactive queries keep the agent dashboard and buyer dashboard in sync with no socket plumbing.

## 3. SCHEMA

```
orgs              { name, state, settings, flags }
users             { clerkId, email, name, phone }
memberships       { userId, orgId, role: buyer|agent|broker|admin|vendor }
clients           { userId, orgId, preferences, prequalStatus, budget }
transactions      { orgId, clientId, agentId, propertyId, stage, status, keyDates }
properties        { address, specs, media, source: manual|csv|mls, mlsId? }
journeyStages     { orgId, key, label, order, defaultTasks }
tasks             { transactionId, stage, title, assigneeRole, dueDate, blockedBy[], status }
documents         { transactionId, type, storageId, extractedSummary, status, uploadedBy }
documentGrants    { documentId, granteeId, scope, expiresAt, grantedBy }
appointments      { transactionId, type, propertyId?, startsAt, endsAt, participants[] }
tours             { clientId, agentId, date, status }
tourStops         { tourId, propertyId, order, arriveAt, departAt, driveMinutes }
showingFeedback   { tourStopId, verdict: love|maybe|no, ratings{kitchen,location,yard,condition,layout,value}, notes }
comps             { propertyId, address, soldPrice, soldDate, specs, source }
offers            { transactionId, terms, status, reviewedByLicenseeId, submittedAt }
offerScenarios    { offerId, strategy: stronger|balanced|value, terms, modeledOutcome, tradeoffs }
vendors           { orgId, category, name, contact, compensationModel: 'none' }
vendorAssignments { vendorId, transactionId, scope, expiresAt, status }
conciergeThreads  { transactionId, messages[], embeddings }
auditLog          { actorId, action, targetType, targetId, at, meta }   // append-only
```

**Invariants. Non-negotiable, enforced in code and in review:**

1. Document access resolves through documentGrants inside a Convex server function. Never a client-side filter. Never "the UI doesn't render it."
2. auditLog is append-only. No update or delete function is ever written against it.
3. Every computed money figure carries provenance: 'ai_estimate' | 'lender_issued' | 'title_issued' | 'user_entered'. Estimates are visually distinct from issued figures in every surface.
4. No offer leaves draft without reviewedByLicenseeId set.
5. PII (SSN, full account numbers, DOB, full street address) is tokenized by the redaction layer before any model call.

## 4. MODULES

### M1 — Journey Roadmap

Visual stage tracker: Discovery → Financing → Favorites → Showings → Offer → Negotiation → Under Contract → Inspection → Appraisal → Title → Final Walkthrough → Closing → Move-In. Stages are org-configurable via journeyStages. Each stage holds tasks, deadlines, documents, appointments, contacts, and an AI next-step summary. Stage transitions write to auditLog.

**Accept:** seeded mid-flight transaction passes the ten-second test in §1. Stage advance is blocked while a blocking task is open.

### M2 — Document Vault

Upload, auto-classify by type, AI summary, missing-item detection against the stage's required-document list. Permission-based sharing: buyer grants a specific document to a specific party with a scope and an expiry. Revocation is immediate. Every view logged.

**Accept:** lender granted the preapproval cannot load the inspection report by ID. Revoked grant returns denied on the next query. Audit log shows every access.

### M3 — AI Transaction Concierge

Persistent assistant scoped to one transaction. RAG over that transaction's documents, tasks, dates, appointments, and contacts only. Answers: what happens next, when is my inspection, what am I missing, how much cash will I need, what did the inspection find, what changed in the counteroffer, who is my lender, when do I leave for my first showing.

Hard behavior rules in the prompt file: explains, never advises. Refuses out-of-scope questions. Surfaces "Ask my agent" on anything touching strategy, price, or legal meaning.

**Accept:** correct answers on the eight canonical questions against seed data; refuses a question about another client's transaction; never returns an unsourced dollar figure.

### M4 — Showing Scheduler

Buyer selects properties → "Build My Tour." Optimizer accounts for property availability windows, appointment length, drive time (Routes API matrix), geography, buyer availability, agent availability, and buffers. Output is a mapped itinerary with departure and arrival times, directions, and property briefs. Push notification before departure. Changing or removing a stop re-optimizes the remainder.

Post-showing capture: verdict (love / maybe / no) plus category ratings. Feedback writes to showingFeedback and feeds M9 ranking.

**Accept:** four properties across a 25-mile spread yield a feasible itinerary; removing stop 2 re-optimizes without manual edit; no stop violates its availability window.

### M5 — Offer Center

Pre-offer market context: comps, listing history, price reductions, days on market, competing inventory, estimated market position. Three modeled strategies with explicit tradeoffs:

- **Stronger** — optimized toward competitiveness
- **Balanced** — price against buyer protections
- **Value** — favorable economics, higher rejection risk

Non-price variables modeled: seller concessions, closing date, earnest money, financing terms, contingencies, inspection terms.

**Accept:** all three scenarios render with stated tradeoffs; every figure carries provenance; reviewedByLicenseeId gate enforced server-side, not just in UI.

### M6 — Offer Cost Simulator

Interactive. Inputs: purchase price, down payment, seller concessions, rate assumption, loan program. Outputs: estimated loan, closing costs, cash to close, monthly payment. Recalculates live. Every output labeled ESTIMATE with the assumption set visible.

**Accept:** changing price by $10k updates all six derived figures correctly; assumptions panel always reachable; no output renders without its label.

### M7 — Contract & Document Explainer

Plain-English explanation of what a clause says, section by section. Describes; does not opine on enforceability, does not recommend clauses, does not draft language. Every section carries "Ask my agent," which routes the question to the licensee with the section attached.

**Accept:** output passes the UPL checklist in docs/legal/upl-checklist.md; routing delivers section context to the agent thread.

### M8 — Agent Command Center

Cross-client dashboard. Every client's stage at a glance, AI-prioritized daily list, exception surfacing: missing financing document, inspection due tomorrow, offer awaiting response, closing this week.

**Accept:** eight seeded clients render with correct stages; priority list surfaces the two exception clients first.

### M9 — Conversational Property Search

Natural language in ("4-bedroom under $450k, some land, good garage, ~20 minutes from town") → structured criteria → ranked results with a stated reason per property. Learns from saves, dislikes, tours, and M4 feedback.

**Data source is flag-controlled.** FLAG_MLS off: runs against manual/CSV properties labeled as sample data. On: runs against the licensed feed. No scraping of any listing site, ever.

**Accept:** the canonical query above parses to correct structured criteria; each result shows its reason; feedback measurably shifts subsequent ranking.

### M10 — Vendor Directory + Portal

Stage-triggered surfacing: at inspection stage, inspectors appear with compare and request-appointment. Categories: lenders, inspectors, insurance, title, surveyors, pest, HVAC, plumbing, electrical, roofing, movers, locksmiths, cleaners, internet.

Vendor portal: scoped, expiring access to one transaction. Receive assignment, message, schedule, request documents, upload report or invoice, mark complete.

vendors.compensationModel is hard-pinned to 'none' with a server-side block on any other value while FLAG_VENDOR_COMP is off. No payment flow ships in this module.

**Accept:** vendor sees only their assigned transaction and only granted documents; access expires on schedule; any write attempting a non-none compensation model is rejected server-side.

### M11 — E-Signature

Provider integration (Dropbox Sign or DocuSign API). App owns workflow, audit trail, and retention; provider owns cryptography. Flow: Prepare → Explain (M7) → Agent Review → Buyer Review → Verify → Sign → Audit Trail → Storage → advance stage.

Behind FLAG_ESIGN, default off.

### M12 — Identity & Biometric Security

Two tiers. Tier 1: device-native Face ID / Android biometric for app unlock. No face template stored or transmitted, ever. Tier 2: vendor IDV (Persona or Stripe Identity) comparing government ID to live selfie, required before high-risk actions — accessing financial documents, executing designated documents, changing account recovery.

Behind FLAG_IDV, default off, per-state gating table.

### M13 — Homeownership Hub

Post-close. Maintenance calendar, warranty and document retention, value tracking, vendor re-engagement.

## 5. LEGAL CONSTRAINTS AS BUILD SPEC

These are implementation requirements, not disclaimers.

| Constraint | Implementation |
| --- | --- |
| State real estate licensing | AI is decision support. Licensee is actor of record. Invariant #4. |
| Unauthorized practice of law | M7 describes only. Templated output. UPL checklist gate. |
| RESPA §8 | M10 ships zero payment flow. compensationModel: 'none' pinned server-side. |
| ESIGN / UETA / brokerage retention | M11 integrates a provider. App owns audit trail + retention policy. |
| BIPA / CUBI / WA biometric law | M12 tier 1 stores nothing. Tier 2 is vendor-side, flagged, per-state gated. |
| PII in model prompts | Redaction layer between app and provider. No exceptions. |
| Funds handling | App never moves money. Estimates labeled, issued figures sourced. |

## 6. MLS DATA GATE

M9 against live inventory requires all three, in order: brokerage/broker license → local MLS membership (Valley MLS and/or NALMLS for north Alabama) → signed IDX or RESO Web API data license. FLAG_MLS stays off until the license is in hand. Until then M9 runs on manual/CSV inventory labeled as sample data. Scraping any listing site is prohibited in this codebase.

## 7. BUILD ORDER

| Phase | Modules | Gate |
| --- | --- | --- |
| **P0** Foundation | repo, CI, schema, Clerk, role routing, seed | seeded buyer sees own transaction; cannot load another's by URL |
| **P1** Transaction OS | M1, M2, M3 | ten-second test passes; concierge answers 8 canonical questions; grant/revoke enforced server-side |
| **P2** Scheduler | M4 | 4-property itinerary + re-optimize on removal |
| **P3** Offer | M5, M6, M7 | licensee gate enforced; all figures labeled; UPL checklist passes |
| **P4** Agent | M8 | 8 clients render; exceptions prioritized |
| **P5** Vendors | M10 | scoped access + expiry + comp block verified |
| **P6** Sign + ID | M11, M12 | flags off; integration tested in sandbox only |
| **P7** Search | M9 | parses canonical query; ranking responds to feedback |
| **P8** Post-close | M13 | — |

No phase begins until the prior gate passes.

## 8. ENGINEERING RULES

1. **Vertical slices.** Every PR ships schema + server function + UI + test for one capability. No backend-only PRs.
2. **Permission test mandatory.** Every data-reading function ships with a test asserting an unauthorized role is denied.
3. **lib/llm/ is the only path to a model.** Prompts live in lib/llm/prompts/ as versioned files. No inline prompt strings anywhere.
4. **Provenance on every figure**, in the data, not just the UI.
5. **Feature flags** on M9, M10 comp, M11, M12. Default off. Flag flips are human decisions.
6. **Playwright gate** — these five flows pass before any phase is called done: buyer login → dashboard · document upload → grant → third-party view → revoke · tour build → reorder · offer draft → licensee gate · concierge scope refusal
7. **Escalate, don't guess.** Anything needing a legal judgment, license, paid account, production credential, or signature → GitHub issue tagged needs-human, then move to the next task. No workarounds, no stub credentials, no assumptions.

## 9. AGENT ORG

| Bot | Owns | Escalates |
| --- | --- | --- |
| **CTO** (DRI) | roadmap, phase gates, PR review, merges, needs-human queue | legal / licensing / payment |
| **Convex** | schema, server functions, migrations, seed | anything touching §3 invariants |
| **Frontend** | routes, components, journey UI, simulator | design decisions with no spec precedent |
| **Auth & Security** | Clerk, role matrix, documentGrants, audit log, redaction | any request to widen access scope |
| **AI** | concierge, RAG, prompt files, guardrails, provenance | any prompt that could produce advice |
| **QA** | Playwright, permission tests, CI, fixtures | coverage gap the CTO wants skipped |

**Token discipline:** /poteto-mode is reserved for hard work — schema design, the documentGrants permission model, RAG scoping, tour optimization, offer math. Mechanical CRUD, component scaffolding, and styling route to fast models without the rigor wrapper. CTO reports token spend per phase.

## 10. HANDOFF PROMPT

Setup: create repo homebase, commit this file to docs/DESIGN.md, create a Grok Bot named **CTO**, connect the GitHub plugin, install pstack. Then paste the following as its first message.

You are the CTO and Directly Responsible Individual for the homebase repository. Read docs/DESIGN.md in full before anything else and re-read the relevant sections at the start of every task. It is the source of truth and it outranks your preferences.

**First action:** you are carrying more than one agent should. Hire child bots reporting to you, matching the org chart in §9 — Convex, Frontend, Auth & Security, AI, QA. Give each a narrow charter from its row: what it owns, what it escalates. Every child bot reads docs/DESIGN.md before its first task and re-reads its relevant sections before each subsequent one. From then on, coordinate with them directly rather than through me. Assign work, review their PRs, resolve conflicts between them. Auth & Security reviews every PR touching document access or role checks, including yours.

**Deliver:** the build order in §7, starting at P0. Do not skip a phase gate. Do not begin a phase until the prior gate's acceptance criteria pass and you've reported the result.

**Rules:**

- Vertical slices only. Schema + server function + UI + test in every PR.
- The five invariants in §3 are absolute. Never resolve document access client-side. Never write an update or delete against auditLog.
- /poteto-mode for schema, the permission model, RAG scoping, tour optimization, and offer math. Fast models without the rigor wrapper for everything mechanical. Report token spend at each phase gate.
- Feature flags on M9, M10 compensation, M11, M12 default to off. You do not flip a flag.
- Do not install Stripe, Dropbox Sign, DocuSign, Persona, or any MLS/IDX client before their phase. Never scrape a listing site.
- When a task needs a legal judgment, a license, a paid account, a production credential, or a signature: stop, open a GitHub issue tagged needs-human stating the question and what's blocked, move to the next task. No workarounds, no stub credentials, no proceeding on assumption.
- To change docs/DESIGN.md, propose the diff and wait.

Post your P0 plan as PR-sized units with acceptance criteria, then execute. I read threads view-only.

## 11. needs-human QUEUE — items the team will escalate

Brokerage formation or written partnership with a licensed broker · Valley MLS / NALMLS membership · signed IDX or RESO data license · attorney review of RESPA structure before M10 compensation · attorney review of M7 output against state UPL rules · E&O and cyber liability coverage · per-state biometric/IDV review before FLAG_IDV · every production credential, payment method, and signature.
