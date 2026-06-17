// VeGAS PoC — status lifecycle & actions
// Parity-shaped model of the legacy "SP Aktion1..8" stage transitions.
import type { Position } from './types'

export type ActionKind = 'primary' | 'neutral' | 'danger'

export interface ActionDef {
  key: string
  de: string
  en: string
  legacy: string // legacy module reference (for traceability)
  from: number[] // allowed current status codes
  to: number // resulting status code
  kind: ActionKind
  requires?: (p: Position) => string[] // returns list of missing prerequisites
}

// Validation gate roughly mirroring fkt_Pruefungen_durchfuehren staging:
// requesting costing requires the core position fields to be present.
function requestRequires(p: Position): string[] {
  const missing: string[] = []
  if (!p.deliveryStart || !p.deliveryEnd) missing.push('Lieferzeitraum')
  if (!p.annualQuantityKwh) missing.push('Menge')
  if (!p.product) missing.push('Produkt')
  if (!p.country) missing.push('Land')
  return missing
}

export const ACTIONS: ActionDef[] = [
  { key: 'anlegen', de: 'Anlegen', en: 'Create', legacy: 'SP Aktion1', from: [10], to: 30, kind: 'neutral' },
  { key: 'anfragen', de: 'Anfragen', en: 'Request costing', legacy: 'SP Aktion2', from: [20, 30], to: 40, kind: 'primary', requires: requestRequires },
  { key: 'costing', de: 'Costing eintreffen', en: 'Costing arrives', legacy: '(Costing-Job)', from: [40], to: 50, kind: 'neutral' },
  { key: 'anbieten', de: 'Anbieten', en: 'Offer', legacy: 'SP Aktion3', from: [50], to: 60, kind: 'primary' },
  { key: 'annehmen', de: 'Annehmen', en: 'Accept', legacy: 'SP Aktion4', from: [60], to: 70, kind: 'primary' },
  { key: 'finalisieren', de: 'Finalisieren', en: 'Finalize', legacy: 'SP Aktion5', from: [70, 85], to: 90, kind: 'primary' },
  { key: 'aendern', de: 'BV-Änderung', en: 'Contract change', legacy: 'SP Aktion8', from: [70, 90], to: 85, kind: 'neutral' },
  { key: 'aufheben', de: 'Anfrage aufheben', en: 'Revoke request', legacy: 'SP Aktion7', from: [40, 50], to: 30, kind: 'neutral' },
  { key: 'stornoCosting', de: 'Costing stornieren', en: 'Cancel costing', legacy: 'SP Aktion6', from: [40, 50], to: 30, kind: 'neutral' },
  { key: 'ablehnen', de: 'Ablehnen', en: 'Reject', legacy: '(Ablehnung)', from: [60], to: 80, kind: 'danger' },
  { key: 'storno', de: 'Stornieren', en: 'Cancel', legacy: '(Storno)', from: [30, 40, 50, 60, 70, 85, 90], to: 100, kind: 'danger' },
]

export interface AvailableAction {
  action: ActionDef
  missing: string[]
}

export function actionsFor(p: Position): AvailableAction[] {
  return ACTIONS.filter((a) => a.from.includes(p.status)).map((a) => ({
    action: a,
    missing: a.requires ? a.requires(p) : [],
  }))
}
