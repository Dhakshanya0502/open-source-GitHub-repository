/**
 * Receipt persistence.
 *
 * Vercel serverless functions are stateless between invocations, so generated
 * receipts are persisted to Vercel KV (Upstash Redis) when it is configured.
 * When KV env vars are absent we fall back to an in-memory store scoped to the
 * current runtime instance — fine for a hackathon demo, but receipts will NOT
 * survive a cold start. That case is logged clearly.
 */

export type StoredReceipt = {
  /** The record's ULID (recordId from cool.record()). */
  id: string
  /** Dotted event type, e.g. `model.execution`. */
  type: string
  /** The run/session id shared by all steps of one agent run. */
  executionId: string
  /** ISO timestamp when this receipt was stored. */
  issuedAt: string
  /** Position of this step within its run (0-based). */
  order: number
  /** The full, self-contained `cool.receipt.v2` evidence object. */
  evidence: unknown
  /** Whether this receipt has been deliberately corrupted via /api/tamper. */
  tampered: boolean
}

const KEY = "agentproof:receipts"

const kvEnabled = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
)

// In-memory fallback, kept on globalThis so it survives module reloads (HMR)
// within a single long-lived runtime instance.
const globalStore = globalThis as unknown as {
  __agentproofReceipts?: StoredReceipt[]
  __agentproofWarned?: boolean
}

if (!kvEnabled && !globalStore.__agentproofWarned) {
  globalStore.__agentproofWarned = true
  console.log(
    "[v0] Vercel KV not configured (KV_REST_API_URL/KV_REST_API_TOKEN missing). " +
      "Using in-memory store — receipts will NOT survive a serverless cold start.",
  )
}

async function readAll(): Promise<StoredReceipt[]> {
  if (kvEnabled) {
    const { kv } = await import("@vercel/kv")
    const list = await kv.get<StoredReceipt[]>(KEY)
    return list ?? []
  }
  return globalStore.__agentproofReceipts ?? []
}

async function writeAll(list: StoredReceipt[]): Promise<void> {
  if (kvEnabled) {
    const { kv } = await import("@vercel/kv")
    await kv.set(KEY, list)
    return
  }
  globalStore.__agentproofReceipts = list
}

/** Persist a batch of freshly generated receipts (newest run replaces the list). */
export async function saveReceipts(receipts: StoredReceipt[]): Promise<void> {
  await writeAll(receipts)
}

/** Return every stored receipt, ordered by run position. */
export async function getReceipts(): Promise<StoredReceipt[]> {
  const list = await readAll()
  return [...list].sort((a, b) => a.order - b.order)
}

/** Return a single stored receipt by id, or null. */
export async function getReceipt(id: string): Promise<StoredReceipt | null> {
  const list = await readAll()
  return list.find((r) => r.id === id) ?? null
}

/** Apply a mutation to one stored receipt and persist it. Returns the updated record. */
export async function updateReceipt(
  id: string,
  mutate: (receipt: StoredReceipt) => StoredReceipt,
): Promise<StoredReceipt | null> {
  const list = await readAll()
  const index = list.findIndex((r) => r.id === id)
  if (index === -1) return null
  const updated = mutate(list[index])
  list[index] = updated
  await writeAll(list)
  return updated
}

/** Whether persistent KV storage is active (vs. the ephemeral in-memory fallback). */
export const isPersistent = kvEnabled
