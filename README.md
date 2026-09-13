# AgentProof

**Turn an AI agent's actions into cryptographically verifiable, privacy-preserving evidence — using the [Cool SDK](https://github.com/Northwind-Cipher/cool-sdk).**

> "Anyone can show you a log. AgentProof is the only one who can prove you didn't edit it."

## What this project is

AI agents increasingly take real actions — approving refunds, calling tools, making policy decisions — but the only record of what they did is a log their own operator controls and can quietly edit. AgentProof is a working prototype that shows a different model: every meaningful step an agent takes is turned into a **signed, tamper-evident receipt** using the Cool SDK, and anyone — an auditor, a regulator, a customer — can verify that receipt independently, without trusting AgentProof's servers.

This directly targets a real, dated compliance gap: EU AI Act Article 12 requires a queryable, defensible record of AI-driven decisions for high-risk systems, with full enforcement from August 2, 2026, and 75% of enterprise leaders (KPMG, 2026) already name auditability as the top blocker keeping AI agents stuck in pilot.

## What it actually does

1. **Run Agent** triggers a deterministic, 5-step mock agent (no real LLM call) that processes a fictional refund request:
   - `agent.run.started`
   - `tool.invocation` (an order lookup)
   - `model.execution` (a refund decision)
   - `policy.decision` (policy-limit check)
   - `agent.run.completed`
2. Every step is passed through **`cool.record()`**, which produces a signed `cool.receipt.v2` evidence object. Metadata and payloads (like the "customer message" and "decision rationale") are stored as **salted-hash commitments** — the plaintext is never written into the receipt.
3. Each receipt can be **verified independently** via `verifyEvidence()`, which returns a structured, 7-domain verdict (`binding`, `signature`, `inclusion`, `witnesses`, `attestation`, `enclave`, `anchor`) — never a single collapsed pass/fail.
4. A **tamper** action lets you corrupt one hex character of a receipt's hash field, then re-verify it live — `binding` and `signature` flip to `FAILED` immediately, demonstrating that the evidence is genuinely tamper-evident, not just logged.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Cool SDK** (`cool-nwc`) — runs server-side only, inside Next.js API routes
- **Vercel KV** (Upstash Redis) for persisting receipts across serverless invocations, with an automatic in-memory fallback if KV isn't configured (fine for local/demo use, but receipts won't survive a cold start in that mode)
- Tailwind CSS for styling
- `@vercel/analytics` (only active in production)

## Project structure

```
app/
  page.tsx                 → Dashboard: run button + execution trail
  api/run/route.ts         → POST: runs the mock agent, generates 5 receipts
  api/receipts/route.ts    → GET: lists all stored receipts
  api/verify/[id]/route.ts → POST: verifies one receipt, returns the full verdict
  api/tamper/[id]/route.ts → POST: corrupts one receipt's hash field
lib/
  cool.ts                  → Cool SDK client setup (simulated attestation mode)
  agent.ts                 → The 5-step mock agent script
  store.ts                 → Receipt persistence (Vercel KV or in-memory fallback)
components/
  ExecutionTrail.tsx       → Step-by-step timeline UI
  VerdictTable.tsx         → 7-domain verdict display
  ReceiptViewer.tsx        → Raw JSON receipt viewer
```

## Running it locally

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`, click **Run Agent**, then verify and tamper with individual receipts from the execution trail.

To enable persistent storage instead of the in-memory fallback, set:
```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```
(from a Vercel KV / Upstash instance).

## Deploying to Vercel

```sh
vercel link
vercel env add KV_REST_API_URL      # optional but recommended
vercel env add KV_REST_API_TOKEN    # optional but recommended
vercel --prod
```

## Important: what this prototype does and does not prove

- ✅ Proves a receipt wasn't edited after it was signed, and that it was sealed by a specific key.
- ✅ Demonstrates privacy-preserving evidence — no prompts, outputs, or customer data appear in any receipt, only salted commitments.
- ❌ Does **not** use real hardware attestation. This demo always runs in the Cool SDK's built-in **simulated** attestation mode — no Intel TDX / Phala dstack hardware is involved, and the UI labels this honestly rather than presenting it as a hardware root of trust.
- ❌ Does **not** prove the agent's decision was correct, fair, or policy-compliant — only that the record of what it did is authentic and unaltered.
- ❌ Not production-ready, not "unhackable," not a substitute for a full compliance program — it's a hackathon-grade demonstration of the underlying cryptographic pattern.

## Why Cool SDK specifically

- **Privacy by commitment** — `cool.record()` hashes metadata/payloads with a salt and discards the plaintext, so an audit trail can exist without creating a new data-liability surface.
- **Hybrid post-quantum signatures** — ML-DSA-65 + Ed25519 over canonical CBOR, so a future break of either scheme alone can't forge a receipt.
- **RFC 6962 transparency log** — inclusion proofs catch silent deletion or reordering of the underlying log, not just single-record edits.
- **Honest, structured verdicts** — `verifyEvidence()` never disguises `simulated` as `pass`, which is exactly the honesty this demo relies on.
