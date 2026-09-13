"use client"

export function ReceiptViewer({ evidence }: { evidence: unknown }) {
  const json = JSON.stringify(evidence, null, 2)

  return (
    <div className="rounded-lg border border-[#1E2A44] bg-[#0C1322]/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#3ED6C4]" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wider text-[#7C8AA5]">
          Raw cool.receipt.v2
        </span>
      </div>
      <p className="mb-3 rounded-md border border-[#3ED6C4]/25 bg-[#3ED6C4]/5 px-3 py-2 text-xs leading-relaxed text-[#9FE9DF]">
        No prompt, output, or customer data appears here — only salted commitments
        (<span className="font-mono">mh:sha256:…</span> hashes and <span className="font-mono">hex:</span> salts).
      </p>
      <pre className="max-h-80 overflow-auto rounded-md bg-[#060A14] p-3 font-mono text-xs leading-relaxed text-[#B8C4DA]">
        <code>{json}</code>
      </pre>
    </div>
  )
}
