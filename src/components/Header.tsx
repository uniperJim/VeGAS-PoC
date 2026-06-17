export function Header({ count, onAbout }: { count: number; onAbout: () => void }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">VeGAS</span>
        <span className="brand-sub">Vertriebs- &amp; Gas-Abrechnungssystem — Proof of Concept</span>
      </div>
      <div className="header-meta">
        <span className="pill">{count} Verträge</span>
        <span className="pill pill-warn">Synthetische Daten</span>
        <button className="about-btn" onClick={onAbout} title="Was ist das? Bedienung &amp; Umfang">
          <span className="about-icon" aria-hidden="true">?</span>
          Über / Hilfe
        </button>
      </div>
    </header>
  )
}
