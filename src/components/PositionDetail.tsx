import type { Position } from '../domain/types'
import { actionsFor } from '../domain/lifecycle'
import type { ActionDef } from '../domain/lifecycle'
import { LifecycleBar } from './LifecycleBar'
import { PriceResult } from './PriceResult'
import { StatusBadge } from './StatusBadge'
import { fmtKwh, fmtRange } from '../domain/format'

interface Props {
  position: Position
  onAction: (action: ActionDef) => void
  log: string[]
}

export function PositionDetail({ position, onAction, log }: Props) {
  const available = actionsFor(position)
  return (
    <div className="detail">
      <div className="detail-top">
        <div>
          <div className="detail-title">{position.name}</div>
          <div className="detail-meta">
            {position.id} · {position.product} · {position.commodity} · {position.country} ·{' '}
            {position.deliveryType}
          </div>
        </div>
        <StatusBadge code={position.status} />
      </div>

      <div className="facts">
        <div className="fact">
          <span className="fact-k">Lieferzeitraum</span>
          <span className="fact-v">{fmtRange(position.deliveryStart, position.deliveryEnd)}</span>
        </div>
        <div className="fact">
          <span className="fact-k">Jahresmenge</span>
          <span className="fact-v">{fmtKwh(position.annualQuantityKwh)}</span>
        </div>
        <div className="fact">
          <span className="fact-k">Produkt</span>
          <span className="fact-v">{position.product}</span>
        </div>
      </div>

      <LifecycleBar current={position.status} />

      <div className="actions">
        <div className="actions-label">Aktionen</div>
        <div className="actions-row">
          {available.length === 0 && <span className="muted">Keine Aktionen verfügbar (Endzustand).</span>}
          {available.map(({ action, missing }) => {
            const blocked = missing.length > 0
            return (
              <button
                key={action.key}
                className={`btn btn-${action.kind}`}
                disabled={blocked}
                title={
                  blocked
                    ? `Fehlende Voraussetzungen: ${missing.join(', ')}`
                    : `${action.en} → Status ${action.to} (${action.legacy})`
                }
                onClick={() => onAction(action)}
              >
                {action.de}
                <span className="btn-to">→ {action.to}</span>
              </button>
            )
          })}
        </div>
      </div>

      <PriceResult position={position} />

      <div className="audit">
        <div className="audit-head">Verlauf (Session)</div>
        {log.length === 0 ? (
          <div className="muted">Noch keine Aktionen in dieser Sitzung.</div>
        ) : (
          <ul className="audit-list">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
