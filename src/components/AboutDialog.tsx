import { useEffect, useState } from 'react'
import { IntegrationDiagram } from './IntegrationDiagram'

type TabKey = 'overview' | 'howto' | 'scope' | 'integration'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Überblick' },
  { key: 'howto', label: 'Bedienung' },
  { key: 'scope', label: 'Umfang' },
  { key: 'integration', label: 'Integration & Datenfluss' },
]

// What the PoC shows vs. what the real application would do.
const SCOPE: { area: string; poc: string; real: string }[] = [
  { area: 'Daten', poc: 'Synthetisch, nur im Browser; beim Neuladen zurückgesetzt', real: 'Echte Verträge in SQL Server, Mandanten, vollständige Historie' },
  { area: 'Lebenszyklus', poc: 'Vereinfachter Statusfluss, per Buttons sichtbar', real: 'Vollständige Statusmaschine inkl. Rollen, Rechten, Vier-Augen-Prinzip' },
  { area: 'Preisbildung', poc: 'AP/GP/PP vereinfacht (gleichmäßige Monatsmenge)', real: 'Lastprofile, Sonderformeln (MoPo/Spot/Reserve), echte Preiskurven & Costing' },
  { area: 'Validierung', poc: 'Wenige Pflichtfeld-Prüfungen (als Tooltip sichtbar)', real: 'Umfangreiche Prüfregeln je Status (P_1/P_2/P_5) + Zusatzprüfungen' },
  { area: 'Schnittstellen', poc: 'Keine — nur als Diagramm erläutert', real: 'SAP IS-U (F2EE), Endur, REMIT/MasterDataHub, SAP-PI, PKFG' },
  { area: 'Automatik', poc: 'Nicht vorhanden', real: 'Job-Engine im 60-Sek-Takt, Watchdogs, automatischer Wiederanlauf' },
  { area: 'Persistenz', poc: 'Keine — nichts wird gespeichert', real: 'Dauerhafte Speicherung, Audit-Trail, Reporting' },
  { area: 'Dokumente', poc: 'Keine', real: 'Angebote, Excel-/PDF-Erzeugung, E-Mail-Versand' },
  { area: 'Sicherheit', poc: 'Keine (öffentliche Demo)', real: 'Entra-ID-Login, Rollen/Rechte, Key Vault, Protokollierung' },
]

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>('overview')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Über diesen Prototyp" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Über diesen Prototyp</div>
            <div className="modal-sub">VeGAS Reimplementation — Proof of Concept</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab${tab === t.key ? ' is-active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'overview' && (
            <section className="prose">
              <p className="lead">
                Dies ist ein <strong>klickbarer Prototyp</strong>, mit dem Sie die geplante Neuentwicklung
                von VeGAS „anfassen“ können. Die Idee: durch <strong>Ausprobieren</strong> bekommen Sie ein
                Gefühl dafür, wie sich die Anwendung später anfühlen soll — und Sie können früh Feedback geben.
              </p>

              <div className="two-col">
                <div className="card card-ok">
                  <div className="card-head">Was es ist</div>
                  <ul>
                    <li>Eine Demo des <strong>Lebenszyklus</strong> einer Vertragsposition (Anlegen → Anfragen → Costing → Anbieten → Annehmen → Finalisieren).</li>
                    <li>Eine vereinfachte <strong>Preisbildung</strong> (Arbeitspreis AP, Grundpreis GP, Position PP).</li>
                    <li>Ein Werkzeug zur <strong>Abstimmung</strong> mit Fachbereich und Stakeholdern.</li>
                  </ul>
                </div>
                <div className="card card-no">
                  <div className="card-head">Was es (noch) nicht ist</div>
                  <ul>
                    <li><strong>Kein</strong> Produktivsystem und keine echte Datenbank.</li>
                    <li><strong>Keine</strong> echten Kunden, Mengen oder Preise — alle Daten sind erfunden.</li>
                    <li><strong>Keine</strong> Schnittstellen (SAP, Endur, REMIT …) — diese werden nur erklärt.</li>
                  </ul>
                </div>
              </div>

              <p className="note">
                Hinweis: Es wird nichts gespeichert. Mit <em>„Zurücksetzen“</em> stellen Sie jederzeit den
                Ausgangszustand wieder her — probieren Sie ruhig alles aus.
              </p>
            </section>
          )}

          {tab === 'howto' && (
            <section className="prose">
              <p className="lead">In wenigen Schritten durch den Prototyp:</p>
              <ol className="howto">
                <li><strong>Position wählen.</strong> Links unter „Verträge &amp; Positionen“ eine Zeile anklicken. Der farbige Punkt zeigt die Sparte (Gas/Strom), das Etikett den aktuellen Status.</li>
                <li><strong>Lebenszyklus ablesen.</strong> In der Mitte zeigt die Statusleiste den Weg der Position; der aktive Schritt ist hervorgehoben.</li>
                <li><strong>Aktionen ausführen.</strong> Unter „Aktionen“ die Buttons klicken, um die Position weiterzubewegen. Auf jedem Button steht der Zielstatus (z.&nbsp;B. <code>→ 50</code>).</li>
                <li><strong>Regeln entdecken.</strong> Manche Aktionen sind gesperrt, wenn Voraussetzungen fehlen — der Tooltip nennt den Grund. So werden Validierungsregeln sichtbar.</li>
                <li><strong>Preis ansehen.</strong> Ab Status <strong>„Gekostet“ (50)</strong> erscheint das Preisergebnis mit AP-/GP-Perioden und enthaltener Marge.</li>
                <li><strong>Verlauf prüfen.</strong> „Verlauf (Session)“ protokolliert Ihre Schritte.</li>
                <li><strong>Zurücksetzen.</strong> Oben links jederzeit den Ausgangszustand wiederherstellen.</li>
              </ol>
              <p className="note">
                Tipp: Öffnen Sie bewusst die Position mit dem Etikett <strong>„Sonderformel“</strong> (MoPo). Sie
                zeigt, was der PoC absichtlich offenlässt und in der echten App gesondert berechnet würde.
              </p>
            </section>
          )}

          {tab === 'scope' && (
            <section className="prose">
              <p className="lead">Gegenüberstellung: was dieser Prototyp zeigt — und was die fertige Anwendung leisten soll.</p>
              <table className="scope-table">
                <thead>
                  <tr>
                    <th>Bereich</th>
                    <th>Im PoC (Prototyp)</th>
                    <th>In der echten App (Ziel)</th>
                  </tr>
                </thead>
                <tbody>
                  {SCOPE.map((r) => (
                    <tr key={r.area}>
                      <td className="scope-area">{r.area}</td>
                      <td>{r.poc}</td>
                      <td>{r.real}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === 'integration' && (
            <section className="prose">
              <p className="lead">
                So würden Verträge und Daten in der echten Anwendung fließen. Der Prototyp bildet nur den
                <strong> grün markierten</strong> Teil ab (Frontend, Lebenszyklus, Preis-Anzeige).
              </p>
              <IntegrationDiagram />
              <ul className="flow-list">
                <li><strong>Vertrieb → Frontend:</strong> erfasst Verträge und Positionen.</li>
                <li><strong>Frontend ↔ SQL Server:</strong> liest und schreibt Stammdaten, Status und Preise.</li>
                <li><strong>Beschaffung/PKFG → SQL Server:</strong> liefert Preiskurven und Costing-Ergebnisse.</li>
                <li><strong>Automatik (Job-Engine):</strong> verarbeitet im 60-Sek-Takt und bedient die Schnittstellen:
                  <strong> SAP IS-U</strong> (Abrechnung/F2EE über CPI), <strong>Endur</strong> (Handelsbestätigung),
                  <strong> REMIT/MasterDataHub</strong> (UTI-Meldung), <strong>SAP-PI</strong> (Meterpoint/ZEMD).</li>
              </ul>
            </section>
          )}
        </div>

        <div className="modal-foot">
          <span className="muted">Alle Daten synthetisch · keine Gewähr · nur zur Abstimmung</span>
          <button className="btn btn-primary" onClick={onClose}>Verstanden</button>
        </div>
      </div>
    </div>
  )
}
