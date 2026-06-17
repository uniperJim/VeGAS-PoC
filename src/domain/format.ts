// VeGAS PoC — formatting helpers (de-DE locale)
const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const num2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function fmtEur(v: number): string {
  return eur.format(v)
}

export function fmtCt(v: number, dp = 5): string {
  return `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v)} ct/kWh`
}

export function fmtKwh(v: number): string {
  return `${num2.format(v)} kWh`
}

export function fmtNum(v: number, dp = 2): string {
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v)
}

export function fmtPeriod(ym: string): string {
  const [y, m] = ym.split('-')
  return `${m}/${y}`
}

export function fmtRange(fromYm: string, toYm: string): string {
  return fromYm === toYm ? fmtPeriod(fromYm) : `${fmtPeriod(fromYm)} – ${fmtPeriod(toYm)}`
}
