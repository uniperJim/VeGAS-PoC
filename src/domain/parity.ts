// VeGAS PoC — Phase 1: calculation parity harness
// Compares THIS engine's pricing output against "expected" values (in real use:
// exported from the legacy system, tbl_Kunden_AP/GP/PP). Everything runs in the
// browser; loaded data is never uploaded or persisted.
import type { Position } from './types'
import { pricePosition, round } from './pricing'

export interface ExpectedApRow {
  fromYm: string
  toYm: string
  apCt: number
}
export interface ExpectedGpRow {
  fromYm: string
  toYm: string
  gpEurMonth: number
}
export interface ExpectedTotals {
  energyEur: number
  gpEur: number
  grandTotalEur: number
}

export interface ParityCase {
  // A full position (incl. costing input) the engine will price.
  position: Position
  // The values the legacy system produced for the same inputs.
  expected: {
    ap: ExpectedApRow[]
    gp: ExpectedGpRow[]
    totals: ExpectedTotals
  }
}

export interface ParityTolerance {
  apCt: number
  gpEur: number
  ppEur: number
}

export interface ParityFile {
  source: string
  generatedAt?: string
  tolerance?: Partial<ParityTolerance>
  cases: ParityCase[]
}

export const DEFAULT_TOLERANCE: ParityTolerance = { apCt: 0.00001, gpEur: 0.01, ppEur: 0.01 }

export type RowStatus = 'match' | 'mismatch' | 'missing'

export interface CompareRow {
  metric: 'AP' | 'GP' | 'Summe'
  label: string
  expected: number | null
  actual: number | null
  delta: number | null
  withinTol: boolean
  status: RowStatus
  unit: string
}

export interface CaseResult {
  id: string
  name: string
  rows: CompareRow[]
  matched: number
  total: number
  ok: boolean
}

export interface ParityReport {
  source: string
  generatedAt?: string
  tolerance: ParityTolerance
  cases: CaseResult[]
  totalRows: number
  matchedRows: number
  mismatchedRows: number
  missingRows: number
  maxAbsDelta: number
  casesOk: number
  ok: boolean
}

function key(fromYm: string, toYm: string): string {
  return `${fromYm}__${toYm}`
}

function compare(
  metric: CompareRow['metric'],
  label: string,
  unit: string,
  expected: number | null,
  actual: number | null,
  tol: number,
): CompareRow {
  if (expected === null || actual === null) {
    return { metric, label, expected, actual, delta: null, withinTol: false, status: 'missing', unit }
  }
  const delta = round(actual - expected, 6)
  const withinTol = Math.abs(delta) <= tol
  return { metric, label, expected, actual, delta, withinTol, status: withinTol ? 'match' : 'mismatch', unit }
}

export function runParity(file: ParityFile): ParityReport {
  const tol: ParityTolerance = { ...DEFAULT_TOLERANCE, ...(file.tolerance ?? {}) }
  const cases: CaseResult[] = []

  for (const c of file.cases) {
    const result = pricePosition(c.position)
    const rows: CompareRow[] = []

    // ---- AP periods (join by from/to period) ----
    const actualAp = new Map(result.apPeriods.map((a) => [key(a.fromYm, a.toYm), a.apCt]))
    const expectedAp = new Map(c.expected.ap.map((a) => [key(a.fromYm, a.toYm), a.apCt]))
    for (const k of new Set([...actualAp.keys(), ...expectedAp.keys()])) {
      const [fromYm, toYm] = k.split('__')
      rows.push(
        compare('AP', `${fromYm}…${toYm}`, 'ct/kWh', expectedAp.get(k) ?? null, actualAp.get(k) ?? null, tol.apCt),
      )
    }

    // ---- GP periods ----
    const actualGp = new Map(result.gpPeriods.map((g) => [key(g.fromYm, g.toYm), g.gpEurMonth]))
    const expectedGp = new Map(c.expected.gp.map((g) => [key(g.fromYm, g.toYm), g.gpEurMonth]))
    for (const k of new Set([...actualGp.keys(), ...expectedGp.keys()])) {
      const [fromYm, toYm] = k.split('__')
      rows.push(
        compare('GP', `${fromYm}…${toYm}`, 'EUR/Monat', expectedGp.get(k) ?? null, actualGp.get(k) ?? null, tol.gpEur),
      )
    }

    // ---- Totals ----
    rows.push(compare('Summe', 'Energie (PP)', 'EUR', c.expected.totals.energyEur, result.totals.energyEur, tol.ppEur))
    rows.push(compare('Summe', 'Grundpreis', 'EUR', c.expected.totals.gpEur, result.totals.gpEur, tol.ppEur))
    rows.push(compare('Summe', 'Gesamt', 'EUR', c.expected.totals.grandTotalEur, result.totals.grandTotalEur, tol.ppEur))

    const matched = rows.filter((r) => r.status === 'match').length
    cases.push({
      id: c.position.id,
      name: c.position.name,
      rows,
      matched,
      total: rows.length,
      ok: matched === rows.length,
    })
  }

  const allRows = cases.flatMap((c) => c.rows)
  const maxAbsDelta = allRows.reduce((m, r) => (r.delta !== null ? Math.max(m, Math.abs(r.delta)) : m), 0)

  return {
    source: file.source,
    generatedAt: file.generatedAt,
    tolerance: tol,
    cases,
    totalRows: allRows.length,
    matchedRows: allRows.filter((r) => r.status === 'match').length,
    mismatchedRows: allRows.filter((r) => r.status === 'mismatch').length,
    missingRows: allRows.filter((r) => r.status === 'missing').length,
    maxAbsDelta: round(maxAbsDelta, 6),
    casesOk: cases.filter((c) => c.ok).length,
    ok: cases.every((c) => c.ok),
  }
}

// Minimal shape validation for user-loaded files.
export function validateParityFile(data: unknown): ParityFile {
  if (typeof data !== 'object' || data === null) throw new Error('Datei ist kein JSON-Objekt.')
  const f = data as Record<string, unknown>
  if (!Array.isArray(f.cases)) throw new Error('Feld "cases" (Array) fehlt.')
  for (const [i, c] of (f.cases as unknown[]).entries()) {
    const cc = c as Record<string, unknown>
    if (!cc.position) throw new Error(`Fall ${i + 1}: "position" fehlt.`)
    if (!cc.expected) throw new Error(`Fall ${i + 1}: "expected" fehlt.`)
    const exp = cc.expected as Record<string, unknown>
    if (!Array.isArray(exp.ap) || !Array.isArray(exp.gp) || !exp.totals) {
      throw new Error(`Fall ${i + 1}: "expected" benötigt ap[], gp[] und totals.`)
    }
  }
  return data as ParityFile
}
