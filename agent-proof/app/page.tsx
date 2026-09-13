"use client"

import { useState } from "react"
import { ExecutionTrail, type Receipt } from "@/components/ExecutionTrail"

export default function Page() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [running, setRunning] = useState(false)
  const [persistent, setPersistent] = useState<boolean | null>(null)

  async function runAgent() {
    setRunning(true)
    try {
      await fetch("/api/run", { method: "POST" })
      // Refresh from the store so we render exactly what was persisted.
      const res = await fetch("/api/receipts")
      const data = await res.json()
      if (data.ok) {
        setReceipts(data.receipts as Receipt[])
        setPersistent(Boolean(data.persistent))
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0C1322] text-[#E5ECF5]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#E5ECF5] sm:text-3xl">
              Agent<span className="text-[#3ED6C4]">Proof</span>
            </h1>
            <span className="rounded-full border border-[#F5B942]/40 bg-[#F5B942]/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#F5B942]">
              simulated attestation
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-[#9AA7C0] sm:text-base">
            Turn an AI agent&apos;s actions into cryptographically verifiable, privacy-preserving
            evidence. Each step is recorded through the{" "}
            <span className="font-mono text-[#3ED6C4]">Cool SDK</span> as a signed{" "}
            <span className="font-mono text-[#3ED6C4]">cool.receipt.v2</span> — metadata and
            payloads become salted-hash commitments, never plaintext. Every receipt is
            independently verifiable across 7 domains and is tamper-evident.
          </p>
        </header>

        <section className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={runAgent}
            disabled={running}
            className="rounded-lg bg-[#3ED6C4] px-5 py-2.5 text-sm font-bold text-[#06231F] shadow-[0_0_0_1px_rgba(62,214,196,0.4)] transition hover:bg-[#5FE4D4] disabled:opacity-50"
          >
            {running ? "Running agent…" : "Run Agent"}
          </button>
          {receipts.length > 0 ? (
            <span className="font-mono text-xs text-[#7C8AA5]">
              {receipts.length} receipts generated
            </span>
          ) : null}
          {persistent !== null ? (
            <span className="font-mono text-xs text-[#4E5D78]">
              storage: {persistent ? "Vercel KV (persistent)" : "in-memory (ephemeral)"}
            </span>
          ) : null}
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#7C8AA5]">
            Execution Trail
          </h2>
          <ExecutionTrail receipts={receipts} />
        </section>

        <footer className="mt-12 border-t border-[#1E2A44] pt-5">
          <p className="text-xs leading-relaxed text-[#4E5D78]">
            Attestation runs in the Cool SDK&apos;s built-in simulated mode — no Intel TDX / Phala
            dstack hardware is involved. Domains labelled <span className="text-[#F5B942]">simulated</span>{" "}
            reflect this and are never presented as a hardware root of trust.
          </p>
        </footer>
      </div>
    </main>
  )
}
