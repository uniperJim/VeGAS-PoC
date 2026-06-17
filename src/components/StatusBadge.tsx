import { statusByCode } from '../domain/types'

export function StatusBadge({ code }: { code: number }) {
  const s = statusByCode(code)
  return (
    <span className={`badge badge-s${code}`} title={`${s.code} · ${s.en}`}>
      <span className="badge-code">{s.code}</span>
      {s.de}
    </span>
  )
}
