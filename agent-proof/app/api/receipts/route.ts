import { NextResponse } from "next/server"
import { getReceipts, isPersistent } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const receipts = await getReceipts()

  return NextResponse.json({
    ok: true,
    persistent: isPersistent,
    receipts: receipts.map((r) => ({
      id: r.id,
      type: r.type,
      order: r.order,
      executionId: r.executionId,
      issuedAt: r.issuedAt,
      tampered: r.tampered,
      evidence: r.evidence,
    })),
  })
}
