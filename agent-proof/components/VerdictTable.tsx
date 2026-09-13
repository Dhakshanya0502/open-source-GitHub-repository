"use client"

export type DomainCheck = {
  status: "pass" | "simulated" | "absent" | "fail" | string
  detail?: string
}

export type Verdict = {
  ok: boolean
  schema?: string
  subject?: {
    subject?: string
    issued_at?: string
    record_id?: string
    key_id?: string
    tee?: string
  }
  checks: Record<string, DomainCheck>
  reasons?: string[]
}

// Fixed 7-domain display order.
const DOMAINS = [
  "binding",
  "signature",
  "inclusion",
  "witnesses",
  "attestation",
  "enclave",
  "anchor",
] as const

function statusStyle(status: string): { dot: string; text: string; label: string } {
  switch (status) {
    case "pass":
      return { dot: "bg-[#34D399]", text: "text-[#34D399]", label: "PASS" }
    case "simulated":
      return { dot: "bg-[#F5B942]", text: "text-[#F5B942]", label: "SIMULATED" }
    case "fail":
    case "failed":
      return { dot: "bg-[#F87171]", text: "text-[#F87171]", label: "FAILED" }
    case "absent":
    default:
      return { dot: "bg-[#64748B]", text: "text-[#64748B]", label: status.toUpperCase() }
  }
}

export function VerdictTable({ verdict }: { verdict: Verdict }) {
  const overall = verdict.ok
    ? { text: "text-[#34D399]", ring: "border-[#34D399]/40 bg-[#34D399]/10", label: "ok: true" }
    : { text: "text-[#F87171]", ring: "border-[#F87171]/40 bg-[#F87171]/10", label: "ok: false" }

  return (
    <div className="rounded-lg border border-[#1E2A44] bg-[#0C1322]/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[#7C8AA5]">
          7-Domain Verdict
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold ${overall.ring} ${overall.text}`}
        >
          {overall.label}
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-[#1E2A44]">
        {DOMAINS.map((domain) => {
          const check = verdict.checks?.[domain] ?? { status: "absent" }
          const s = statusStyle(check.status)
          return (
            <li key={domain} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex min-w-[9rem] items-center gap-2">
                <span className={`h-2 w-2 flex-none rounded-full ${s.dot}`} aria-hidden="true" />
                <span className="font-mono text-sm text-[#E5ECF5]">{domain}</span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className={`font-mono text-xs font-semibold ${s.text}`}>{s.label}</span>
                {check.detail ? (
                  <span className="text-xs leading-relaxed text-[#7C8AA5]">{check.detail}</span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {verdict.subject?.tee ? (
        <p className="mt-3 border-t border-[#1E2A44] pt-3 font-mono text-xs text-[#7C8AA5]">
          TEE: <span className="text-[#F5B942]">{verdict.subject.tee}</span>
        </p>
      ) : null}
    </div>
  )
}
