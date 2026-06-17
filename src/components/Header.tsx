export function Header({ count }: { count: number }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">VeGAS</span>
        <span className="brand-sub">Vertriebs- &amp; Gas-Abrechnungssystem — Proof of Concept</span>
      </div>
      <div className="header-meta">
        <span className="pill">{count} Verträge</span>
        <span className="pill pill-warn">Synthetische Daten</span>
      </div>
    </header>
  )
}
