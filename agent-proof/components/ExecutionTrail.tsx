"use client"

import { useState } from "react"
import { VerdictTable, type Verdict } from "./VerdictTable"
import { ReceiptViewer } from "./ReceiptViewer"

export type Receipt = {
  id: string
  type: string
  order: number
  executionId: string
  issuedAt: string
  tampered: boolean
  evidence: unknown
}

const STEP_LABELS: Record<string, string> = {
  "agent.run.started": "Run started",
  "tool.invocation": "Tool call",
  "model.execution": "Model execution",
  "policy.decision": "Policy decision",
  "agent.run.completed": "Run completed",
}

function StepCard({ receipt }: { receipt: Receipt }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [tampered, setTampered] = useState(receipt.tampered)
  const [busy, setBusy] = useState<"verify" | "tamper" | null>(null)

  async function verify() {
    setBusy("verify")
    try {
      const res = await fetch(`/api/verify/${receipt.id}`, { method: "POST" })
      const data = await res.json()
      if (data.ok) setVerdict(data.verdict as Verdict)
    } finally {
      setBusy(null)
    }
  }

  async function tamper() {
    setBusy("tamper")
    try {
      await fetch(`/api/tamper/${receipt.id}`, { method: "POST" })
      setTampered(true)
      // Immediately re-verify so the verdict visibly flips in place.
      const res = await fetch(`/api/verify/${receipt.id}`, { method: "POST" })
      const data = await res.json()
      if (data.ok) setVerdict(data.verdict as Verdict)
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="flex w-full flex-col rounded-xl border border-[#1E2A44] bg-[#111A2E] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[#3ED6C4]/40 bg-[#3ED6C4]/10 font-mono text-xs font-semibold text-[#3ED6C4]">
            {receipt.order + 1}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#E5ECF5]">
              {STEP_LABELS[receipt.type] ?? receipt.type}
            </span>
            <span className="font-mono text-xs text-[#7C8AA5]">{receipt.type}</span>
          </div>
        </div>
        {tampered ? (
          <span className="flex-none rounded-full border border-[#F87171]/40 bg-[#F87171]/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#F87171]">
            tampered
          </span>
        ) : null}
      </div>

      <p className="mt-2 truncate font-mono text-[11px] text-[#4E5D78]" title={receipt.id}>
        {receipt.id}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={verify}
          disabled={busy !== null}
          className="rounded-md bg-[#3ED6C4] px-3 py-1.5 text-xs font-semibold text-[#06231F] transition hover:bg-[#5FE4D4] disabled:opacity-50"
        >
          {busy === "verify" ? "Verifying…" : "Verify"}
        </button>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          disabled={busy !== null}
          className="rounded-md border border-[#2C3A57] px-3 py-1.5 text-xs font-semibold text-[#B8C4DA] transition hover:border-[#3ED6C4]/50 hover:text-[#E5ECF5] disabled:opacity-50"
        >
          {showRaw ? "Hide Raw Receipt" : "View Raw Receipt"}
        </button>
        <button
          type="button"
          onClick={tamper}
          disabled={busy !== null}
          className="rounded-md border border-[#F87171]/50 px-3 py-1.5 text-xs font-semibold text-[#F87171] transition hover:bg-[#F87171]/10 disabled:opacity-50"
        >
          {busy === "tamper" ? "Tampering…" : "Tamper"}
        </button>
      </div>

      {verdict ? (
        <div className="mt-4">
          <VerdictTable verdict={verdict} />
        </div>
      ) : null}

      {showRaw ? (
        <div className="mt-4">
          <ReceiptViewer evidence={receipt.evidence} />
        </div>
      ) : null}
    </li>
  )
}

export function ExecutionTrail({ receipts }: { receipts: Receipt[] }) {
  if (receipts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#1E2A44] bg-[#111A2E]/40 p-10 text-center">
        <p className="text-sm text-[#7C8AA5]">
          No run yet. Click <span className="font-semibold text-[#3ED6C4]">Run Agent</span> to
          generate a 5-step verifiable evidence trail.
        </p>
      </div>
    )
  }

  return (
    <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {receipts.map((receipt) => (
        <StepCard key={receipt.id} receipt={receipt} />
      ))}
    </ol>
  )
}
