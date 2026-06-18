// VeGAS PoC — synthetic sample for the parity harness.
// SAFE TO COMMIT/DEPLOY: contains only synthetic data. The "expected" values are
// generated from the engine itself, then a few are deliberately perturbed so the
// diff view demonstrably flags discrepancies (proving the harness isn't always-green).
// For a REAL parity run, replace "expected" with values exported from the legacy system.
import { loadContracts } from './data'
import { pricePosition, round } from './pricing'
import type { ParityCase, ParityFile } from './parity'

export function buildSampleParityFile(): ParityFile {
  const cases: ParityCase[] = []
  for (const c of loadContracts()) {
    for (const p of c.positions) {
      if (p.special) continue // MoPo special formula intentionally not in the PoC engine
      const r = pricePosition(p)
      cases.push({
        position: p,
        expected: {
          ap: r.apPeriods.map((a) => ({ fromYm: a.fromYm, toYm: a.toYm, apCt: a.apCt })),
          gp: r.gpPeriods.map((g) => ({ fromYm: g.fromYm, toYm: g.toYm, gpEurMonth: g.gpEurMonth })),
          totals: {
            energyEur: r.totals.energyEur,
            gpEur: r.totals.gpEur,
            grandTotalEur: r.totals.grandTotalEur,
          },
        },
      })
    }
  }

  // --- Inject a few discrepancies to exercise the diff UI ---
  // 1) AP off by 0.012 ct/kWh in the first period of the 2nd case
  if (cases[1]?.expected.ap[0]) {
    cases[1].expected.ap[0].apCt = round(cases[1].expected.ap[0].apCt + 0.012, 5)
  }
  // 2) GP off by 5 EUR/month in the first period of the 3rd case
  if (cases[2]?.expected.gp[0]) {
    cases[2].expected.gp[0].gpEurMonth = round(cases[2].expected.gp[0].gpEurMonth + 5, 2)
  }
  // 3) Grand total off by 12.50 EUR in the 4th case
  if (cases[3]) {
    cases[3].expected.totals.grandTotalEur = round(cases[3].expected.totals.grandTotalEur + 12.5, 2)
  }

  return {
    source: 'synthetic-sample',
    generatedAt: new Date().toISOString(),
    tolerance: { apCt: 0.00001, gpEur: 0.01, ppEur: 0.01 },
    cases,
  }
}
