// VeGAS PoC — Phase 1: calculation parity view.
// Loads a parity file (synthetic sample, or a JSON the user picks/drops), runs
// THIS engine over each case and diffs against the "expected" (legacy) values.
// IMPORTANT: file loading is 100% in-browser (FileReader). Nothing is uploaded,
// transmitted or persisted — safe for the public demo and for local real-data runs.
import { useRef, useState } from 'react'
import { runParity, validateParityFile, type ParityReport } from '../domain/parity'
import { buildSampleParityFile } from '../domain/sampleParity'
import { fmtNum } from '../domain/format'

function fmtVal(v: number | null, unit: string): string {
  if (v === null) return '—'
  return fmtNum(v, unit === 'ct/kWh' ? 5 : 2)
}

const STATUS_LABEL: Record<string, string> = { match: 'OK', mismatch: 'Abweichung', missing: 'fehlt' }

export function ParityView() {
  const [report, setReport] = useState<ParityReport | null>(null)
  const [source, setSource] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [onlyDiff, setOnlyDiff] = useState(false)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function loadSample() {
    setError(null)
    setReport(runParity(buildSampleParityFile()))
    setSource('Synthetisches Beispiel')
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        const pf = validateParityFile(data)
        setReport(runParity(pf))
        setSource(file.name)
        setError(null)
      } catch (e) {
        setReport(null)
        setError(e instanceof Error ? e.message : 'Datei konnte nicht gelesen werden.')
      }
    }
    reader.onerror = () => setError('Datei konnte nicht gelesen werden.')
    reader.readAsText(file)
  }

  function downloadSample() {
    const blob = new Blob([JSON.stringify(buildSampleParityFile(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vegas-parity-sample.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="view-head">
        <h1 className="view-title">Kalkulations-Parität</h1>
        <p className="view-lead">
          Vergleicht die Ergebnisse dieser Neufassung Zeile für Zeile mit den erwarteten Werten des
          Altsystems (<code>tbl_Kunden_AP/GP/PP</code>). Toleranzen: AP&nbsp;1e-5&nbsp;ct/kWh, GP/PP&nbsp;0,01&nbsp;EUR.
        </p>
      </div>

      <div className="notice" role="note">
        <strong>Datenschutz:</strong> Das Laden einer Datei erfolgt ausschließlich lokal im Browser
        (FileReader). Es werden <strong>keine Daten hochgeladen, übertragen oder gespeichert</strong>.
        Für einen echten Abgleich exportieren Sie die Legacy-Werte und ersetzen das Feld
        <code>expected</code> — die Struktur liefert „Beispiel herunterladen“.
      </div>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={loadSample}>Beispiel laden</button>
        <button className="btn" onClick={() => inputRef.current?.click()}>JSON laden…</button>
        <button className="btn" onClick={downloadSample}>Beispiel herunterladen</button>
        <span className="spacer" />
        <label className="toggle">
          <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
          nur Abweichungen
        </label>
      </div>

      <label
        className={`dropzone${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => handleFiles(e.target.files)}
        />
        Parity-JSON hierher ziehen oder klicken zum Auswählen
      </label>

      {error && (
        <div className="notice notice-warn" style={{ marginTop: 14 }}>
          <strong>Datei ungültig:</strong> {error}
        </div>
      )}

      {report && (
        <>
          <div className={`status-banner ${report.ok ? 'status-ok' : 'status-bad'}`} style={{ marginTop: 16 }}>
            {report.ok
              ? `Alle ${report.totalRows} Vergleichswerte innerhalb Toleranz.`
              : `${report.mismatchedRows} Abweichung(en)` +
                (report.missingRows ? `, ${report.missingRows} fehlende Zeile(n)` : '') +
                ' erkannt.'}
          </div>

          <div className="kpi-grid">
            <div className={`kpi ${report.ok ? 'kpi-accent' : ''}`}>
              <div className="kpi-label">Fälle OK</div>
              <div className="kpi-value">
                {report.casesOk}/{report.cases.length}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Zeilen geprüft</div>
              <div className="kpi-value">{fmtNum(report.totalRows, 0)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Abweichungen</div>
              <div className="kpi-value">{report.mismatchedRows}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">max |Δ|</div>
              <div className="kpi-value">{fmtNum(report.maxAbsDelta, 5)}</div>
            </div>
          </div>

          <p className="muted" style={{ marginBottom: 8 }}>
            Quelle: <strong>{source}</strong>
            {report.generatedAt ? ` · erzeugt ${new Date(report.generatedAt).toLocaleString('de-DE')}` : ''}
          </p>

          {report.cases.map((c) => {
            const rows = onlyDiff ? c.rows.filter((r) => r.status !== 'match') : c.rows
            if (onlyDiff && rows.length === 0) return null
            return (
              <div className="panel" key={c.id}>
                <div className="case-head">
                  <span className="case-name">{c.name}</span>
                  <span className={`pchip ${c.ok ? 'is-match' : 'is-mismatch'}`}>
                    {c.ok ? 'OK' : `${c.total - c.matched} Abweichung(en)`}
                  </span>
                </div>
                <table className="grid">
                  <thead>
                    <tr>
                      <th>Metrik</th>
                      <th>Zeitraum / Position</th>
                      <th className="num">Erwartet (Altsystem)</th>
                      <th className="num">Aktuell (Neufassung)</th>
                      <th className="num">Δ</th>
                      <th>Einheit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={r.status !== 'match' ? 'row-mismatch' : ''}>
                        <td>{r.metric}</td>
                        <td>{r.label}</td>
                        <td className="num">{fmtVal(r.expected, r.unit)}</td>
                        <td className="num">{fmtVal(r.actual, r.unit)}</td>
                        <td className="num">{fmtVal(r.delta, r.unit)}</td>
                        <td>{r.unit}</td>
                        <td>
                          <span className={`pchip is-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </>
      )}

      {!report && !error && (
        <div className="empty">Noch kein Abgleich geladen. „Beispiel laden“ zeigt eine Demo mit eingebauten Abweichungen.</div>
      )}
    </div>
  )
}
