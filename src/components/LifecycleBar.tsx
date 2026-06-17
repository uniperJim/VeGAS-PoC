import { MAIN_FLOW, SIDE_STATES, statusByCode } from '../domain/types'

// Linear lifecycle visual. Highlights the current status; if the position is in
// a side state (rejected / in-change / cancelled) that chip is shown too.
export function LifecycleBar({ current }: { current: number }) {
  const currentIdx = MAIN_FLOW.indexOf(current)
  const onMainPath = currentIdx >= 0
  return (
    <div className="lifecycle">
      <div className="lifecycle-track">
        {MAIN_FLOW.map((code, i) => {
          const s = statusByCode(code)
          const done = onMainPath && i < currentIdx
          const active = code === current
          return (
            <div key={code} className={`lc-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
              <span className="lc-node">{s.code}</span>
              <span className="lc-label">{s.de}</span>
            </div>
          )
        })}
      </div>
      {SIDE_STATES.includes(current) && (
        <div className="lifecycle-side">
          <span className="lc-side-chip">Sonderzustand: {statusByCode(current).de}</span>
        </div>
      )}
    </div>
  )
}
