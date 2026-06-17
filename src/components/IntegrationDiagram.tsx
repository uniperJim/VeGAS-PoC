// VeGAS PoC — system integration & data-flow diagram (illustrative).
// Solid teal = conceptually represented in this PoC; dashed grey = real app only.
export function IntegrationDiagram() {
  return (
    <figure className="diagram">
      <svg viewBox="0 0 940 600" role="img" aria-label="VeGAS Integrations- und Datenfluss-Diagramm" className="diagram-svg">
        <defs>
          <marker id="arrow-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#0f6e63" />
          </marker>
          <marker id="arrow-grey" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* VeGAS system container */}
        <rect x="300" y="40" width="260" height="520" rx="14" fill="#f3f8f7" stroke="#cfe3df" />
        <text x="430" y="64" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f6e63">VeGAS</text>

        {/* ---- Connections (drawn first, under the boxes) ---- */}
        {/* Vertrieb -> Frontend */}
        <line x1="174" y1="150" x2="330" y2="120" stroke="#0f6e63" strokeWidth="2" markerEnd="url(#arrow-teal)" />
        {/* Frontend <-> SQL */}
        <line x1="430" y1="160" x2="430" y2="250" stroke="#0f6e63" strokeWidth="2" markerStart="url(#arrow-teal)" markerEnd="url(#arrow-teal)" />
        {/* SQL <-> Automatik */}
        <line x1="430" y1="330" x2="430" y2="430" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" markerStart="url(#arrow-grey)" markerEnd="url(#arrow-grey)" />
        {/* Beschaffung -> SQL */}
        <line x1="174" y1="404" x2="330" y2="306" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-grey)" />
        {/* Automatik -> external systems */}
        <line x1="530" y1="455" x2="720" y2="102" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-grey)" />
        <line x1="530" y1="463" x2="720" y2="202" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-grey)" />
        <line x1="530" y1="471" x2="720" y2="302" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-grey)" />
        <line x1="530" y1="479" x2="720" y2="402" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" markerStart="url(#arrow-grey)" markerEnd="url(#arrow-grey)" />

        {/* arrow labels */}
        <text x="232" y="120" fontSize="9.5" fill="#6b7886">erfasst</text>
        <text x="438" y="210" fontSize="9.5" fill="#6b7886">liest/schreibt</text>
        <text x="180" y="345" fontSize="9.5" fill="#6b7886">Preiskurven</text>
        <text x="610" y="250" fontSize="9.5" fill="#6b7886" transform="rotate(-30 610 250)">via CPI / Schnittstellen</text>

        {/* ---- Boxes ---- */}
        {/* Vertrieb (PoC) */}
        <g>
          <rect x="24" y="118" width="150" height="64" rx="8" fill="#e7f5f3" stroke="#1f9d8f" strokeWidth="1.5" />
          <text x="99" y="146" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f6e63">Vertrieb</text>
          <text x="99" y="164" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">Sales · Erfassung</text>
        </g>
        {/* Beschaffung (real) */}
        <g>
          <rect x="24" y="380" width="150" height="72" rx="8" fill="#ffffff" stroke="#b8c2cc" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="99" y="408" textAnchor="middle" fontSize="13" fontWeight="700" fill="#44515f">Beschaffung</text>
          <text x="99" y="426" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">Costing · PKFG-Preise</text>
          <text x="99" y="440" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">(gateway.apis…)</text>
        </g>

        {/* Frontend (PoC) */}
        <g>
          <rect x="330" y="90" width="200" height="70" rx="8" fill="#e7f5f3" stroke="#1f9d8f" strokeWidth="1.5" />
          <text x="430" y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f6e63">VeGAS Frontend</text>
          <text x="430" y="136" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">Erfassung · Lifecycle</text>
          <text x="430" y="150" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">Pricing-Anzeige</text>
        </g>
        {/* SQL (partly PoC) */}
        <g>
          <rect x="330" y="250" width="200" height="80" rx="8" fill="#eef6f9" stroke="#7fb2cc" strokeWidth="1.5" />
          <text x="430" y="278" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2f5fb0">SQL Server</text>
          <text x="430" y="296" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">Verträge · Positionen · Preise</text>
          <text x="430" y="314" textAnchor="middle" fontSize="9" fill="#94785a">(im PoC: synthetisch im Browser)</text>
        </g>
        {/* Automatik (real) */}
        <g>
          <rect x="330" y="430" width="200" height="80" rx="8" fill="#ffffff" stroke="#b8c2cc" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="430" y="462" textAnchor="middle" fontSize="13" fontWeight="700" fill="#44515f">VeGAS Automatik</text>
          <text x="430" y="480" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">Job-Engine · 60-Sek-Takt</text>
          <text x="430" y="494" textAnchor="middle" fontSize="9.5" fill="#5d6b7a">Watchdogs · Wiederanlauf</text>
        </g>

        {/* External systems (real) */}
        {[
          { y: 70, t: 'SAP IS-U', s: 'Abrechnung (F2EE)' },
          { y: 170, t: 'Endur', s: 'Handel · Trade Conf.' },
          { y: 270, t: 'MasterDataHub', s: 'REMIT · UTI-Meldung' },
          { y: 370, t: 'SAP PI', s: 'Meterpoint · ZEMD' },
        ].map((b) => (
          <g key={b.t}>
            <rect x="720" y={b.y} width="190" height="64" rx="8" fill="#ffffff" stroke="#b8c2cc" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="815" y={b.y + 28} textAnchor="middle" fontSize="13" fontWeight="700" fill="#44515f">{b.t}</text>
            <text x="815" y={b.y + 46} textAnchor="middle" fontSize="9.5" fill="#5d6b7a">{b.s}</text>
          </g>
        ))}
      </svg>

      <figcaption className="diagram-legend">
        <span className="lg lg-poc"><i /> Im PoC abgebildet (Frontend, Lebenszyklus, Pricing-Anzeige)</span>
        <span className="lg lg-real"><i /> Nur in der echten App (Datenbank, Automatik, Schnittstellen)</span>
      </figcaption>
    </figure>
  )
}
