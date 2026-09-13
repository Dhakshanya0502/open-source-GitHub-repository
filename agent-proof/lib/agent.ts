import { createCooL } from "./cool"
import type { StoredReceipt } from "./store"

/**
 * The 5-step mock AI agent script. Every step is fully deterministic — there is
 * no real LLM call. Each step is passed through cool.record() so its metadata
 * and payloads become salted-hash commitments inside a `cool.receipt.v2`.
 */
type Step = {
  type: string
  metadata: Record<string, unknown>
  payloads?: { input?: string; output?: string; state?: string }
}

const STEPS: Step[] = [
  {
    type: "agent.run.started",
    metadata: { goal: "process refund request #4471" },
  },
  {
    type: "tool.invocation",
    metadata: { tool: "orders.lookup" },
    payloads: { input: "order #4471", output: "found, eligible" },
  },
  {
    type: "model.execution",
    metadata: { model: "refund-decider@2", tokens_in: 512, tokens_out: 64 },
    payloads: {
      input: "Customer requests refund for order #4471. Eligible per policy?",
      output: "Refund approved: amount within policy limit; order confirmed eligible.",
    },
  },
  {
    type: "policy.decision",
    metadata: { policy: "refund-limit-200usd", decision: "allow", amount: 149.0 },
  },
  {
    type: "agent.run.completed",
    metadata: { status: "ok", steps: 5 },
  },
]

/**
 * Run the mock agent end to end. All 5 steps share one executionId so the
 * receipts form a single verifiable run trail.
 */
export async function runAgent(): Promise<StoredReceipt[]> {
  const cool = createCooL()
  const executionId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const receipts: StoredReceipt[] = []

  try {
    let order = 0
    for (const step of STEPS) {
      const { evidence, recordId, executionId: eid } = await cool.record({
        type: step.type,
        executionId,
        metadata: step.metadata,
        payloads: step.payloads,
      })

      receipts.push({
        id: recordId,
        type: step.type,
        executionId: eid,
        issuedAt: new Date().toISOString(),
        order: order++,
        evidence,
        tampered: false,
      })
    }
  } finally {
    await cool.flush().catch(() => {})
    await cool.close().catch(() => {})
  }

  return receipts
}
