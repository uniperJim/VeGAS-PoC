// VeGAS PoC — synthetic seed data
// IMPORTANT: 100% synthetic. No production customers, prices or volumes.
// Numbers are illustrative and do not represent real Uniper tariffs.
import type { Contract, CostingInput } from './types'

// A plausible commodity forward curve in ct/kWh by calendar quarter.
function gasCurve(base: number): Record<string, number> {
  return {
    default: base,
    '2025-Q1': base + 0.85,
    '2025-Q2': base - 0.20,
    '2025-Q3': base - 0.35,
    '2025-Q4': base + 0.55,
    '2026-Q1': base + 0.90,
    '2026-Q2': base - 0.10,
    '2026-Q3': base - 0.25,
    '2026-Q4': base + 0.60,
  }
}

function powerCurve(base: number): Record<string, number> {
  return {
    default: base,
    '2025-Q1': base + 1.40,
    '2025-Q2': base - 0.30,
    '2025-Q3': base + 0.10,
    '2025-Q4': base + 0.95,
    '2026-Q1': base + 1.55,
    '2026-Q2': base - 0.25,
    '2026-Q3': base + 0.15,
    '2026-Q4': base + 1.05,
  }
}

const gasCosting = (base: number): CostingInput => ({
  commodityByQuarter: gasCurve(base),
  networkApCt: 1.85,
  marginApCt: 0.35,
  gpBaseEurYear: 480,
  gpServiceEurYear: 240,
  gpMarginEurYear: 180,
})

const powerCosting = (base: number): CostingInput => ({
  commodityByQuarter: powerCurve(base),
  networkApCt: 7.20,
  marginApCt: 0.55,
  gpBaseEurYear: 720,
  gpServiceEurYear: 360,
  gpMarginEurYear: 300,
})

export const CONTRACTS: Contract[] = [
  {
    id: 'BV-100245',
    name: 'Stadtwerke Musterstadt — Vollversorgung Gas',
    customer: 'Stadtwerke Musterstadt GmbH',
    company: 'Uniper Global Commodities SE',
    positions: [
      {
        id: 'POS-100245-01',
        name: 'Gas Standardlast 2025',
        product: 'Vollversorgung',
        commodity: 'Gas',
        country: 'DE',
        deliveryType: 'SLP',
        deliveryStart: '2025-01',
        deliveryEnd: '2025-12',
        annualQuantityKwh: 3_200_000,
        status: 60,
        costing: gasCosting(3.10),
      },
      {
        id: 'POS-100245-02',
        name: 'Gas RLM Werk Nord 2025–2026',
        product: 'Vollversorgung',
        commodity: 'Gas',
        country: 'DE',
        deliveryType: 'RLM',
        deliveryStart: '2025-04',
        deliveryEnd: '2026-03',
        annualQuantityKwh: 18_500_000,
        status: 50,
        costing: gasCosting(3.05),
      },
    ],
  },
  {
    id: 'BV-100312',
    name: 'Muster Industrie AG — Strom RLM',
    customer: 'Muster Industrie AG',
    company: 'Uniper Global Commodities SE',
    positions: [
      {
        id: 'POS-100312-01',
        name: 'Strom RLM Standort Süd 2025',
        product: 'Vollversorgung',
        commodity: 'Strom',
        country: 'DE',
        deliveryType: 'RLM',
        deliveryStart: '2025-01',
        deliveryEnd: '2025-12',
        annualQuantityKwh: 42_000_000,
        status: 90,
        costing: powerCosting(9.40),
      },
      {
        id: 'POS-100312-02',
        name: 'Strom Spotbeschaffung (MoPo)',
        product: 'MoPo Spot',
        special: true,
        commodity: 'Strom',
        country: 'DE',
        deliveryType: 'RLM',
        deliveryStart: '2025-07',
        deliveryEnd: '2026-06',
        annualQuantityKwh: 12_750_000,
        status: 40,
        costing: powerCosting(9.85),
      },
    ],
  },
  {
    id: 'BV-100478',
    name: 'Beispiel Energie GmbH — Gas Neugeschäft',
    customer: 'Beispiel Energie GmbH',
    company: 'Uniper Global Commodities SE',
    positions: [
      {
        id: 'POS-100478-01',
        name: 'Gas Vollversorgung 2026',
        product: 'Vollversorgung',
        commodity: 'Gas',
        country: 'DE',
        deliveryType: 'SLP',
        deliveryStart: '2026-01',
        deliveryEnd: '2026-12',
        annualQuantityKwh: 5_600_000,
        status: 30,
        costing: gasCosting(3.25),
      },
      {
        id: 'POS-100478-02',
        name: 'Gas Tranche AT 2025',
        product: 'Tranche',
        commodity: 'Gas',
        country: 'AT',
        deliveryType: 'RLM',
        deliveryStart: '2025-10',
        deliveryEnd: '2026-09',
        annualQuantityKwh: 9_100_000,
        status: 70,
        costing: gasCosting(3.40),
      },
    ],
  },
]

// Deep clone so in-session state changes never mutate the seed module.
export function loadContracts(): Contract[] {
  return JSON.parse(JSON.stringify(CONTRACTS)) as Contract[]
}
