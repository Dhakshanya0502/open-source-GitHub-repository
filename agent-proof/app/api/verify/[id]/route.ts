import { NextResponse } from "next/server"
import { verifyEvidence } from "@/lib/cool"
import { getReceipt } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const receipt = await getReceipt(id)

  if (!receipt) {
    return NextResponse.json({ ok: false, error: "receipt not found" }, { status: 404 })
  }

  // The full verdict is returned as-is — the UI renders every domain, never a
  // single collapsed boolean.
  const verdict = await verifyEvidence(receipt.evidence)

  return NextResponse.json({ ok: true, tampered: receipt.tampered, verdict })
}
