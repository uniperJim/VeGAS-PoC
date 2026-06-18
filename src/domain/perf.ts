// VeGAS PoC — Phase 1: performance demonstration.
// Generates and prices a full quarter-hour load curve (96 intervals/day,
// 35,040/year — up to ~1M rows for a multi-year position) entirely in the
// browser, and times it. The legacy Access stack struggles at this volume.
import type { Commodity } from './types'
import { round } from './pricing'

const INTERVALS_PER_DAY = 96 // 15-minute resolution
const BASE_YEAR = 2025

export interface PerfPoint {
  label: string // 'YYYY-MM-DD'
  kwh: number // consumption that day
  cumCostEur: number // cumulative cost up to and including that day
}

export interface PerfResult {
  years: number
  commodity: Commodity
  intervals: number
  computeMs: number
  intervalsPerSec: number
  totalKwh: number
  totalCostEur: number
  avgCtPerKwh: number
  peakDay: { label: string; kwh: number }
  daily: PerfPoint[]
}

// Deterministic PRNG (mulberry32) so runs are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

// ct/kWh working price as a function of season/time — quarterly commodity blocks
// plus flat network+margin, plus (for power) an intraday peak/off-peak spread.
function priceCtPerKwh(commodity: Commodity, month: number, hour: number): number {
  const baseGas = 3.1
  const basePower = 9.4
  const quarter = Math.floor((month - 1) / 3) // 0..3
  const seasonal = [0.9, -0.2, -0.35, 0.6][quarter]
  if (commodity === 'Gas') {
    return baseGas + seasonal + 1.85 /*network*/ + 0.35 /*margin*/
  }
  const peak = hour >= 8 && hour < 20 ? 1.2 : -0.8 // power intraday spread
  return basePower + seasonal * 1.5 + peak + 7.2 /*network*/ + 0.55 /*margin*/
}

// Relative consumption shape (mean ~1) by season, weekday and hour.
function shape(commodity: Commodity, doy: number, weekday: number, hour: number, jitter: number): number {
  // seasonal: gas strongly winter-peaked; power milder
  const seasonalAmp = commodity === 'Gas' ? 0.55 : 0.18
  const seasonal = 1 + seasonalAmp * Math.cos((2 * Math.PI * (doy - 15)) / 365)
  // weekend dip (Sat=6, Sun=0)
  const weekend = weekday === 0 || weekday === 6 ? 0.82 : 1.05
  // intraday: morning + evening humps for power; flatter for gas
  const humps =
    commodity === 'Gas'
      ? 1 + 0.25 * Math.cos((2 * Math.PI * (hour - 7)) / 24)
      : 1 + 0.35 * Math.exp(-((hour - 8) ** 2) / 6) + 0.45 * Math.exp(-((hour - 19) ** 2) / 5) - 0.25
  return Math.max(0.05, seasonal * weekend * humps * jitter)
}

export interface PerfOptions {
  years: number
  commodity: Commodity
  annualKwh: number
  seed?: number
}

export function runPerf(opts: PerfOptions): PerfResult {
  const { years, commodity, annualKwh } = opts
  const rng = mulberry32(opts.seed ?? 12345)

  const daily: PerfPoint[] = []
  let totalKwh = 0
  let totalCostEur = 0
  let cumCostEur = 0
  let intervals = 0
  let peakDay = { label: '', kwh: -1 }

  // base consumption per interval so that an "average" year ≈ annualKwh
  const avgPerInterval = annualKwh / (365 * INTERVALS_PER_DAY)

  const t0 = performance.now()
  for (let yi = 0; yi < years; yi++) {
    const year = BASE_YEAR + yi
    const days = isLeap(year) ? 366 : 365
    // day-of-year loop
    const monthLen = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let month = 1
    let dayOfMonth = 1
    let monthAcc = 0
    // weekday of Jan 1 (Zeller-ish via Date once per year is fine, cheap)
    const jan1 = new Date(Date.UTC(year, 0, 1)).getUTCDay()

    for (let doy = 0; doy < days; doy++) {
      const weekday = (jan1 + doy) % 7
      let dayKwh = 0
      let dayCost = 0
      for (let i = 0; i < INTERVALS_PER_DAY; i++) {
        const hour = Math.floor(i / 4)
        const jitter = 0.95 + rng() * 0.1 // ±5%
        const kwh = avgPerInterval * shape(commodity, doy, weekday, hour, jitter)
        const price = priceCtPerKwh(commodity, month, hour)
        dayKwh += kwh
        dayCost += (kwh * price) / 100
        intervals++
      }
      totalKwh += dayKwh
      totalCostEur += dayCost
      cumCostEur += dayCost
      const label = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`
      if (dayKwh > peakDay.kwh) peakDay = { label, kwh: dayKwh }
      daily.push({ label, kwh: dayKwh, cumCostEur })

      // advance calendar
      dayOfMonth++
      monthAcc++
      if (monthAcc >= monthLen[month - 1]) {
        monthAcc = 0
        month++
        dayOfMonth = 1
      }
    }
  }
  const computeMs = performance.now() - t0

  return {
    years,
    commodity,
    intervals,
    computeMs: round(computeMs, 2),
    intervalsPerSec: Math.round(intervals / Math.max(computeMs / 1000, 1e-6)),
    totalKwh: round(totalKwh, 0),
    totalCostEur: round(totalCostEur, 2),
    avgCtPerKwh: totalKwh > 0 ? round((totalCostEur * 100) / totalKwh, 4) : 0,
    peakDay: { label: peakDay.label, kwh: round(peakDay.kwh, 1) },
    daily,
  }
}
