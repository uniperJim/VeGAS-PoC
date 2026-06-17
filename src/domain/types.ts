// VeGAS PoC — domain model
// Synthetic, parity-shaped reconstruction of the VeGAS contract/position model.
// NOTE: all data in this PoC is synthetic. No production data is used.

export type Commodity = 'Gas' | 'Strom'

export interface StatusDef {
  code: number
  key: string
  de: string
  en: string
}

// Status lifecycle (parity with legacy ContractPosition status codes)
export const STATUSES: StatusDef[] = [
  { code: 10, key: 'new', de: 'Neu', en: 'New' },
  { code: 20, key: 'reset', de: 'Zurückgesetzt', en: 'Reset' },
  { code: 30, key: 'saved', de: 'Angelegt', en: 'Saved' },
  { code: 40, key: 'requested', de: 'Angefragt', en: 'Costing requested' },
  { code: 50, key: 'costed', de: 'Gekostet', en: 'Costed' },
  { code: 60, key: 'offered', de: 'Angeboten', en: 'Offered' },
  { code: 70, key: 'accepted', de: 'Angenommen', en: 'Accepted' },
  { code: 80, key: 'rejected', de: 'Abgelehnt', en: 'Rejected' },
  { code: 85, key: 'inchange', de: 'In Änderung', en: 'In change' },
  { code: 90, key: 'finalized', de: 'Finalisiert', en: 'Finalized' },
  { code: 100, key: 'cancelled', de: 'Storniert', en: 'Cancelled' },
]

// The happy-path shown in the lifecycle bar
export const MAIN_FLOW = [30, 40, 50, 60, 70, 90]
// Side states (reachable but off the main path)
export const SIDE_STATES = [80, 85, 100]

export function statusByCode(code: number): StatusDef {
  return STATUSES.find((s) => s.code === code) ?? STATUSES[0]
}

// Costing input — the per-position cost build-up that the (external) costing
// process delivers in the legacy system. Modelled here so the pricing pipeline
// has something faithful to compute from.
export interface CostingInput {
  // Commodity working-price per calendar quarter, ct/kWh (e.g. forward blocks)
  commodityByQuarter: Record<string, number>
  networkApCt: number // network/other AP component, ct/kWh (flat)
  marginApCt: number // AP margin component, ct/kWh (flat)
  gpBaseEurYear: number // base price component, EUR/year
  gpServiceEurYear: number // service component, EUR/year
  gpMarginEurYear: number // GP margin component, EUR/year
}

export interface Position {
  id: string
  name: string
  product: string
  special?: boolean // special product whose bespoke formula is out of PoC scope
  commodity: Commodity
  country: string
  deliveryType: string
  deliveryStart: string // 'YYYY-MM' inclusive
  deliveryEnd: string // 'YYYY-MM' inclusive
  annualQuantityKwh: number // Menge
  status: number
  costing: CostingInput
}

export interface Contract {
  id: string
  name: string
  customer: string
  company: string
  positions: Position[]
}
