import { useMemo } from 'react'
import type { Position } from '../domain/types'
import { pricePosition } from '../domain/pricing'
import { fmtEur, fmtCt, fmtKwh, fmtNum, fmtRange } from '../domain/format'

// Statuses at/after "costed" have a meaningful price result.
const PRICED_FROM = 50

export function PriceResult({ position }: { position: Position }) {
  const result = useMemo(() => pricePosition(position), [position])

  if (position.special) {
    return (
      <div className="panel">
        <div className="panel-head">Preisergebnis</div>
        <div className="notice notice-warn">
          <strong>{position.product}</strong> verwendet eine Sonderformel (z.&nbsp;B. MoPo/Spot,
          Reserveleistung). Diese ist im PoC bewusst nicht abgebildet — sie ist ein gezielter
          Parität-Prüfpunkt für die MVP-Phase.
        </div>
      </div>
    )
  }

  if (position.status < PRICED_FROM) {
    return (
      <div className="panel">
        <div className="panel-head">Preisergebnis</div>
        <div className="notice">
          Noch kein Preisergebnis. Die Position muss erst <strong>angefragt</strong> und
          <strong> gekostet</strong> werden (Status&nbsp;≥&nbsp;50), bevor AP/GP/PP berechnet werden.
        </div>
      </div>
    )
  }

  const t = result.totals
  return (
    <div className="panel">
      <div className="panel-head">
        Preisergebnis
        <span className="panel-head-note">AP / GP / PP — abgeleitet aus dem Costing</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Ø Arbeitspreis</div>
          <div className="kpi-value">{fmtCt(t.avgApCt)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Energie (PP)</div>
          <div className="kpi-value">{fmtEur(t.energyEur)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Grundpreis (GP)</div>
          <div className="kpi-value">{fmtEur(t.gpEur)}</div>
        </div>
        <div className="kpi kpi-accent">
          <div className="kpi-label">Gesamt</div>
          <div className="kpi-value">{fmtEur(t.grandTotalEur)}</div>
        </div>
      </div>

      <div className="result-tables">
        <div className="result-block">
          <div className="result-title">
            Arbeitspreis (AP) — Perioden
            <span className="result-sub">verdichtet aus {t.months} Monaten</span>
          </div>
          <table className="grid">
            <thead>
              <tr>
                <th>Periode</th>
                <th className="num">Commodity</th>
                <th className="num">Netz/Sonst.</th>
                <th className="num">Marge</th>
                <th className="num">AP</th>
                <th className="num">Menge</th>
                <th className="num">PP</th>
              </tr>
            </thead>
            <tbody>
              {result.apPeriods.map((ap) => (
                <tr key={ap.fromYm}>
                  <td>{fmtRange(ap.fromYm, ap.toYm)}</td>
                  <td className="num">{fmtNum(ap.commodityCt, 5)}</td>
                  <td className="num">{fmtNum(ap.networkCt, 5)}</td>
                  <td className="num">{fmtNum(ap.marginCt, 5)}</td>
                  <td className="num strong">{fmtNum(ap.apCt, 5)}</td>
                  <td className="num">{fmtKwh(ap.qtyKwh)}</td>
                  <td className="num">{fmtEur(ap.ppEur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="result-block">
          <div className="result-title">Grundpreis (GP) — Perioden</div>
          <table className="grid">
            <thead>
              <tr>
                <th>Periode</th>
                <th className="num">Basis</th>
                <th className="num">Service</th>
                <th className="num">Marge</th>
                <th className="num">GP/Monat</th>
                <th className="num">GP gesamt</th>
              </tr>
            </thead>
            <tbody>
              {result.gpPeriods.map((gp) => (
                <tr key={gp.fromYm}>
                  <td>{fmtRange(gp.fromYm, gp.toYm)}</td>
                  <td className="num">{fmtEur(gp.baseEur)}</td>
                  <td className="num">{fmtEur(gp.serviceEur)}</td>
                  <td className="num">{fmtEur(gp.marginEur)}</td>
                  <td className="num strong">{fmtEur(gp.gpEurMonth)}</td>
                  <td className="num">{fmtEur(gp.gpEurTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="margin-line">
        <span>Enthaltene Marge (AP {fmtEur(t.apMarginEur)} + GP {fmtEur(t.gpMarginEur)}):</span>
        <strong>{fmtEur(t.marginEur)}</strong>
      </div>

      <p className="trace">
        Pipeline-Parität: <code>Monate_anlegen → Costing_eintragen → ct_kWh_eintragen →
        Pricing_eintragen → Monate_gesamt → Marge_anfügen</code>. PP = AP × Menge. Rundung AP/GP 4&nbsp;dp,
        ct/kWh 5&nbsp;dp. Monatsmenge = Jahresmenge / 12 (PoC-Vereinfachung).
      </p>
    </div>
  )
}
