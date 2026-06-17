import type { Contract, Position } from '../domain/types'
import { StatusBadge } from './StatusBadge'
import { fmtKwh } from '../domain/format'

interface Props {
  contracts: Contract[]
  selectedId: string | null
  onSelect: (pos: Position) => void
}

export function DealList({ contracts, selectedId, onSelect }: Props) {
  return (
    <nav className="deal-list">
      {contracts.map((c) => (
        <section key={c.id} className="deal-group">
          <div className="deal-group-head">
            <div className="deal-group-title">{c.name}</div>
            <div className="deal-group-meta">
              {c.id} · {c.customer}
            </div>
          </div>
          {c.positions.map((p) => (
            <button
              key={p.id}
              className={`pos-row${p.id === selectedId ? ' is-selected' : ''}`}
              onClick={() => onSelect(p)}
            >
              <div className="pos-row-main">
                <span className={`dot dot-${p.commodity === 'Gas' ? 'gas' : 'power'}`} />
                <span className="pos-name">{p.name}</span>
                {p.special && <span className="tag-special" title="Sonderformel — nicht im PoC abgebildet">Sonderformel</span>}
              </div>
              <div className="pos-row-sub">
                <StatusBadge code={p.status} />
                <span className="pos-qty">{fmtKwh(p.annualQuantityKwh)}/a</span>
              </div>
            </button>
          ))}
        </section>
      ))}
    </nav>
  )
}
