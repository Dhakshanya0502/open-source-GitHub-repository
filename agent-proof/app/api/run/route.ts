import { NextResponse } from "next/server"
import { runAgent } from "@/lib/agent"
import { saveReceipts, isPersistent } from "@/lib/store"

// cool-nwc uses Node crypto primitives (ML-DSA-65 + Ed25519), so this route
// must run on the Node.js runtime, never the edge runtime.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const receipts = await runAgent()
    await saveReceipts(receipts)

    return NextResponse.json({
      ok: true,
      persistent: isPersistent,
      receipts: receipts.map((r) => ({
        id: r.id,
        type: r.type,
        order: r.order,
        executionId: r.executionId,
        issuedAt: r.issuedAt,
      })),
    })
  } catch (error) {
    console.log("[v0] /api/run failed:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "run failed" },
      { status: 500 },
    )
  }
}
