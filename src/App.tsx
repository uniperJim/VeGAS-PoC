import { useMemo, useState } from 'react'
import { Header } from './components/Header'
import { DealList } from './components/DealList'
import { PositionDetail } from './components/PositionDetail'
import { loadContracts } from './domain/data'
import type { Contract, Position } from './domain/types'
import { statusByCode } from './domain/types'
import type { ActionDef } from './domain/lifecycle'

function timestamp(): string {
  return new Date().toLocaleTimeString('de-DE')
}

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>(() => loadContracts())
  const [selectedId, setSelectedId] = useState<string | null>(() => loadContracts()[0]?.positions[0]?.id ?? null)
  const [logs, setLogs] = useState<Record<string, string[]>>({})

  // Resolve the currently selected position from the live contract state.
  const selected: Position | null = useMemo(() => {
    for (const c of contracts) {
      const p = c.positions.find((x) => x.id === selectedId)
      if (p) return p
    }
    return null
  }, [contracts, selectedId])

  function handleAction(action: ActionDef) {
    if (!selected) return
    const from = selected.status
    setContracts((prev) =>
      prev.map((c) => ({
        ...c,
        positions: c.positions.map((p) => (p.id === selected.id ? { ...p, status: action.to } : p)),
      })),
    )
    setLogs((prev) => {
      const line = `${timestamp()} — ${action.de} (${action.en}): ${statusByCode(from).de} → ${statusByCode(action.to).de}`
      return { ...prev, [selected.id]: [line, ...(prev[selected.id] ?? [])] }
    })
  }

  function resetAll() {
    const fresh = loadContracts()
    setContracts(fresh)
    setLogs({})
    setSelectedId(fresh[0]?.positions[0]?.id ?? null)
  }

  return (
    <div className="app">
      <Header count={contracts.length} />
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-head">
            <span>Verträge &amp; Positionen</span>
            <button className="btn-link" onClick={resetAll} title="Demo-Zustand zurücksetzen">
              Zurücksetzen
            </button>
          </div>
          <DealList contracts={contracts} selectedId={selectedId} onSelect={(p) => setSelectedId(p.id)} />
        </aside>
        <main className="content">
          {selected ? (
            <PositionDetail position={selected} onAction={handleAction} log={logs[selected.id] ?? []} />
          ) : (
            <div className="empty">Keine Position ausgewählt.</div>
          )}
        </main>
      </div>
      <footer className="app-footer">
        VeGAS Reimplementation PoC · Frontend-only Demo · synthetische Daten · ohne Gewähr —
        dient ausschließlich der Stakeholder-Abstimmung.
      </footer>
    </div>
  )
}
