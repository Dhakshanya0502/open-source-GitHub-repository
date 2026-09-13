import { NextResponse } from "next/server"
import { getReceipt, updateReceipt } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Flip the final hex character of a `mh:sha256:<hex>` multihash to any other digit. */
function corruptMultihash(value: string): string {
  const last = value.slice(-1)
  const hexDigits = "0123456789abcdef"
  let replacement = last
  for (const d of hexDigits) {
    if (d !== last.toLowerCase()) {
      replacement = d
      break
    }
  }
  return value.slice(0, -1) + replacement
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await getReceipt(id)

  if (!existing) {
    return NextResponse.json({ ok: false, error: "receipt not found" }, { status: 404 })
  }

  const updated = await updateReceipt(id, (receipt) => {
    // Deep-clone so we mutate a copy, then target the real hash field on the
    // cool.receipt.v2 record: record.event.metadata_hash.
    const evidence = JSON.parse(JSON.stringify(receipt.evidence)) as {
      record?: { event?: { metadata_hash?: string } }
    }

    const hash = evidence?.record?.event?.metadata_hash
    if (typeof hash === "string") {
      evidence.record!.event!.metadata_hash = corruptMultihash(hash)
    }

    return { ...receipt, evidence, tampered: true }
  })

  return NextResponse.json({ ok: true, tampered: true, id: updated?.id })
}
