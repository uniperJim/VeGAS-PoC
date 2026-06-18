// VeGAS PoC — Phase 1: performance demonstration view.
// Generates and prices a full quarter-hour load curve in the browser, times it,
// and charts daily volume vs. cumulative cost. Demonstrates that the modern engine
// handles volumes (hundreds of thousands of intervals) where the legacy
// Access/VBA stack (Eval-interpreted, single-row updates) hits its limits.
import { useState } from 'react'
import { runPerf, type PerfResult } from '../domain/perf'
import type { Commodity } from '../domain/types'
import { Chart } from './Chart'
import { fmtEur, fmtNum } from '../domain/format'

const YEAR_OPTIONS = [1, 2, 3, 5]

function annualFor(c: Commodity): number {
  return c === 'Gas' ? 4_000_000 : 42_000_000
}

function compute(years: number, commodity: Commodity): PerfResult {
  return runPerf({ years, commodity, annualKwh: annualFor(commodity) })
}

export function PerformanceView() {
  const [years, setYears] = useState(2)
  const [commodity, setCommodity] = useState<Commodity>('Strom')
  const [result, setResult] = useState<PerfResult>(() => compute(2, 'Strom'))
  const [runs, setRuns] = useState(1)

  function apply(y: number, c: Commodity) {
    setYears(y)
    setCommodity(c)
    setResult(compute(y, c))
    setRuns((n) => n + 1)
  }

  const r = result

  return (
    <div>
      <div className="view-head">
        <h1 className="view-title">Performance</h1>
        <p className="view-lead">
          Erzeugt und bepreist eine vollständige Viertelstunden-Lastreihe (96&nbsp;Intervalle/Tag,
          35.040/Jahr) vollständig im Browser und misst die Rechenzeit. Das Altsystem stößt bei diesen
          Datenmengen an seine Grenzen.
        </p>
      </div>

      <div className="controls">
        <div className="control">
          <label htmlFor="perf-years">Zeitraum</label>
          <select id="perf-years" value={years} onChange={(e) => apply(Number(e.target.value), commodity)}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y} {y === 1 ? 'Jahr' : 'Jahre'}
              </option>
            ))}
          </select>
        </div>
        <div className="control">
          <label htmlFor="perf-commodity">Commodity</label>
          <select
            id="perf-commodity"
            value={commodity}
            onChange={(e) => apply(years, e.target.value as Commodity)}
          >
            <option value="Strom">Strom</option>
            <option value="Gas">Gas</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => apply(years, commodity)}>
          Neu berechnen
        </button>
      </div>

      <div className="status-banner status-ok">
        {fmtNum(r.intervals, 0)} Intervalle in {fmtNum(r.computeMs, 1)} ms berechnet — ≈ {fmtNum(r.intervalsPerSec, 0)}{' '}
        Intervalle/s.
      </div>

      <div className="kpi-grid">
        <div className="kpi kpi-accent">
          <div className="kpi-label">Intervalle (15-Min)</div>
          <div className="kpi-value">{fmtNum(r.intervals, 0)}</div>
        </div>
        <div className="kpi kpi-accent">
          <div className="kpi-label">Rechenzeit</div>
          <div className="kpi-value">{fmtNum(r.computeMs, 1)} ms</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Durchsatz</div>
          <div className="kpi-value">{fmtNum(r.intervalsPerSec, 0)}/s</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">⌀ Arbeitspreis</div>
          <div className="kpi-value">{fmtNum(r.avgCtPerKwh, 3)} ct</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Menge gesamt</div>
          <div className="kpi-value">{fmtNum(r.totalKwh / 1_000_000, 2)} GWh</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Kosten gesamt</div>
          <div className="kpi-value">{fmtEur(r.totalCostEur)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Spitzentag</div>
          <div className="kpi-value">{r.peakDay.label}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Tage</div>
          <div className="kpi-value">{fmtNum(r.daily.length, 0)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          Lastgang &amp; kumulierte Kosten
          <span className="panel-head-note">
            {r.commodity} · {r.years} {r.years === 1 ? 'Jahr' : 'Jahre'} · tägliche Aggregation
          </span>
        </div>
        <Chart
          height={320}
          xLabels={r.daily.map((d) => d.label)}
          series={[
            { points: r.daily.map((d) => d.kwh), color: '#2f8fd6', kind: 'area', label: 'Menge/Tag (kWh)', axis: 'left' },
            {
              points: r.daily.map((d) => d.cumCostEur),
              color: '#1f9d8f',
              kind: 'line',
              label: 'Kosten kumuliert (EUR)',
              axis: 'right',
            },
          ]}
        />
      </div>

      <div className="notice notice-warn">
        <strong>Einordnung:</strong> Das Altsystem (Access/VBA, <code>Eval</code>-interpretierte Jobs,
        Einzelsatz-Updates, Neustart ab&nbsp;~3&nbsp;GB Speicher) verarbeitet derartige Viertelstunden-Volumina nur
        zäh und batch-orientiert. Die Neufassung berechnet denselben Umfang hier in
        Millisekunden — bei einer Implementierung in C#/.NET&nbsp;8 mit mengenbasierten SQL-Operationen
        nochmals deutlich schneller und parallelisierbar. (Lauf&nbsp;#{runs})
      </div>
    </div>
  )
}
