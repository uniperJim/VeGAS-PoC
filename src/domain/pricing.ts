// VeGAS PoC — pricing pipeline (AP / GP / PP)
// Parity-shaped TypeScript port of the legacy costing/pricing pipeline:
//   fkt_Kalkulation_zusammenstellen
//     -> Monate_anlegen        (explode delivery period into months)
//     -> Costing_eintragen     (assign cost components per month)
//     -> ct_kWh_eintragen      (derive ct/kWh working price)
//     -> Pricing_eintragen     (AP, GP, PP = AP * Menge)
//     -> Monate_gesamt         (totals)
//     -> Marge_anfuegen        (append margin)
//   then run-length compression into price periods (tbl_Kunden_AP/GP/PP).
//
// Rounding parity: AP/GP rate values 4 dp, ct/kWh 5 dp.
import type { Position } from './types'

export const ROUND_AP_GP = 4
export const ROUND_CT = 5

export function round(v: number, dp: number): number {
  const f = Math.pow(10, dp)
  return Math.round((v + Number.EPSILON) * f) / f
}

export interface MonthRow {
  ym: string
  year: number
  month: number
  quarter: string
  qtyKwh: number
  commodityCt: number
  networkCt: number
  marginCt: number
  apCt: number // ct/kWh total working price
  ppEur: number // priced position = AP * Menge for the month
  gpEur: number // monthly base price
}

export interface ApPeriod {
  fromYm: string
  toYm: string
  months: number
  commodityCt: number
  networkCt: number
  marginCt: number
  apCt: number
  qtyKwh: number
  ppEur: number
}

export interface GpPeriod {
  fromYm: string
  toYm: string
  months: number
  baseEur: number
  serviceEur: number
  marginEur: number
  gpEurMonth: number
  gpEurTotal: number
}

export interface PricingTotals {
  months: number
  qtyKwh: number
  energyEur: number
  gpEur: number
  grandTotalEur: number
  avgApCt: number
  apMarginEur: number
  gpMarginEur: number
  marginEur: number
}

export interface PricingResult {
  months: MonthRow[]
  apPeriods: ApPeriod[]
  gpPeriods: GpPeriod[]
  totals: PricingTotals
}

function quarterOf(year: number, month: number): string {
  return `${year}-Q${Math.floor((month - 1) / 3) + 1}`
}

// Monate_anlegen — explode an inclusive 'YYYY-MM'..'YYYY-MM' span into months.
function monthsBetween(start: string, end: string): { year: number; month: number }[] {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  const out: { year: number; month: number }[] = []
  let y = sy
  let m = sm
  // guard against malformed input
  let guard = 0
  while ((y < ey || (y === ey && m <= em)) && guard < 600) {
    out.push({ year: y, month: m })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
    guard += 1
  }
  return out
}

// Run-length compression of consecutive months that share an AP build-up.
function compressAp(months: MonthRow[]): ApPeriod[] {
  type Acc = ApPeriod & { key: string }
  const acc: Acc[] = []
  for (const m of months) {
    const key = `${m.commodityCt}|${m.networkCt}|${m.marginCt}`
    const last = acc[acc.length - 1]
    if (last && last.key === key) {
      last.toYm = m.ym
      last.months += 1
      last.qtyKwh = round(last.qtyKwh + m.qtyKwh, 2)
      last.ppEur = round(last.ppEur + m.ppEur, 2)
    } else {
      acc.push({
        key,
        fromYm: m.ym,
        toYm: m.ym,
        months: 1,
        commodityCt: m.commodityCt,
        networkCt: m.networkCt,
        marginCt: m.marginCt,
        apCt: m.apCt,
        qtyKwh: m.qtyKwh,
        ppEur: m.ppEur,
      })
    }
  }
  return acc.map((a): ApPeriod => ({
    fromYm: a.fromYm,
    toYm: a.toYm,
    months: a.months,
    commodityCt: a.commodityCt,
    networkCt: a.networkCt,
    marginCt: a.marginCt,
    apCt: a.apCt,
    qtyKwh: a.qtyKwh,
    ppEur: a.ppEur,
  }))
}

function compressGp(months: MonthRow[], parts: { base: number; service: number; margin: number }): GpPeriod[] {
  type Acc = GpPeriod & { key: string }
  const acc: Acc[] = []
  for (const m of months) {
    const key = String(m.gpEur)
    const last = acc[acc.length - 1]
    if (last && last.key === key) {
      last.toYm = m.ym
      last.months += 1
      last.gpEurTotal = round(last.gpEurTotal + m.gpEur, 2)
    } else {
      acc.push({
        key,
        fromYm: m.ym,
        toYm: m.ym,
        months: 1,
        baseEur: parts.base,
        serviceEur: parts.service,
        marginEur: parts.margin,
        gpEurMonth: m.gpEur,
        gpEurTotal: m.gpEur,
      })
    }
  }
  return acc.map((a): GpPeriod => ({
    fromYm: a.fromYm,
    toYm: a.toYm,
    months: a.months,
    baseEur: a.baseEur,
    serviceEur: a.serviceEur,
    marginEur: a.marginEur,
    gpEurMonth: a.gpEurMonth,
    gpEurTotal: a.gpEurTotal,
  }))
}

export function pricePosition(p: Position): PricingResult {
  const c = p.costing
  const list = monthsBetween(p.deliveryStart, p.deliveryEnd)
  // Even monthly volume split (PoC simplification; legacy uses load profiles).
  const monthlyQty = round(p.annualQuantityKwh / 12, 2)
  const gpMonth = round((c.gpBaseEurYear + c.gpServiceEurYear + c.gpMarginEurYear) / 12, 2)

  const months: MonthRow[] = list.map(({ year, month }) => {
    const ym = `${year}-${String(month).padStart(2, '0')}`
    const quarter = quarterOf(year, month)
    const commodityCt = round(c.commodityByQuarter[quarter] ?? c.commodityByQuarter['default'] ?? 0, ROUND_CT)
    const networkCt = round(c.networkApCt, ROUND_CT)
    const marginCt = round(c.marginApCt, ROUND_CT)
    const apCt = round(commodityCt + networkCt + marginCt, ROUND_CT) // ct_kWh_eintragen
    const ppEur = round((apCt / 100) * monthlyQty, 2) // Pricing_eintragen: PP = AP * Menge
    return { ym, year, month, quarter, qtyKwh: monthlyQty, commodityCt, networkCt, marginCt, apCt, ppEur, gpEur: gpMonth }
  })

  const apPeriods = compressAp(months)
  const gpPeriods = compressGp(months, {
    base: round(c.gpBaseEurYear / 12, 2),
    service: round(c.gpServiceEurYear / 12, 2),
    margin: round(c.gpMarginEurYear / 12, 2),
  })

  // Monate_gesamt — totals
  const qtyKwh = round(months.reduce((s, m) => s + m.qtyKwh, 0), 2)
  const energyEur = round(months.reduce((s, m) => s + m.ppEur, 0), 2)
  const gpEur = round(months.reduce((s, m) => s + m.gpEur, 0), 2)
  const apMarginEur = round(months.reduce((s, m) => s + (m.marginCt / 100) * m.qtyKwh, 0), 2)
  const gpMarginEur = round(months.length * round(c.gpMarginEurYear / 12, 2), 2)
  const avgApCt = qtyKwh > 0 ? round((energyEur * 100) / qtyKwh, ROUND_CT) : 0

  return {
    months,
    apPeriods,
    gpPeriods,
    totals: {
      months: months.length,
      qtyKwh,
      energyEur,
      gpEur,
      grandTotalEur: round(energyEur + gpEur, 2),
      avgApCt,
      apMarginEur,
      gpMarginEur,
      marginEur: round(apMarginEur + gpMarginEur, 2),
    },
  }
}
