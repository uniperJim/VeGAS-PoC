// VeGAS PoC — minimal dependency-free SVG chart (area + line, dual axis).
export interface ChartSeries {
  points: number[]
  color: string
  kind: 'area' | 'line'
  label: string
  axis?: 'left' | 'right'
  unit?: string
}

function downsample(points: number[], target: number): number[] {
  if (points.length <= target) return points
  const bucket = points.length / target
  const out: number[] = []
  for (let i = 0; i < target; i++) {
    const start = Math.floor(i * bucket)
    const end = Math.min(points.length, Math.floor((i + 1) * bucket))
    let sum = 0
    for (let j = start; j < end; j++) sum += points[j]
    out.push(sum / Math.max(1, end - start))
  }
  return out
}

const W = 1000
const PAD_L = 8
const PAD_R = 8
const PAD_T = 12
const PAD_B = 22

function niceMax(v: number): number {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * mag
}

function fmtAxis(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} Mio`
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1000)}k`
  return `${Math.round(v)}`
}

export function Chart({ series, xLabels, height = 300 }: { series: ChartSeries[]; xLabels?: string[]; height?: number }) {
  const H = height
  const target = 480
  const prepared = series.map((s) => ({ ...s, ds: downsample(s.points, target) }))
  const n = Math.max(1, ...prepared.map((s) => s.ds.length))

  const leftMax = niceMax(Math.max(0, ...prepared.filter((s) => (s.axis ?? 'left') === 'left').flatMap((s) => s.ds)))
  const rightSeries = prepared.filter((s) => s.axis === 'right')
  const rightMax = rightSeries.length ? niceMax(Math.max(0, ...rightSeries.flatMap((s) => s.ds))) : 1

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const x = (i: number) => PAD_L + (n <= 1 ? 0 : (i / (n - 1)) * plotW)
  const yLeft = (v: number) => PAD_T + plotH - (v / leftMax) * plotH
  const yRight = (v: number) => PAD_T + plotH - (v / rightMax) * plotH

  function path(ds: number[], yf: (v: number) => number, close: boolean): string {
    let d = ''
    ds.forEach((v, i) => {
      d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yf(v).toFixed(1)} `
    })
    if (close) d += `L${x(ds.length - 1).toFixed(1)},${(PAD_T + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD_T + plotH).toFixed(1)} Z`
    return d
  }

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => PAD_T + plotH - f * plotH)

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Verlaufsdiagramm">
        {gridYs.map((gy, i) => (
          <line key={i} x1={PAD_L} y1={gy} x2={W - PAD_R} y2={gy} stroke="#eef2f6" strokeWidth="1" />
        ))}
        {prepared.map((s, si) => {
          const yf = s.axis === 'right' ? yRight : yLeft
          return s.kind === 'area' ? (
            <g key={si}>
              <path d={path(s.ds, yf, true)} fill={s.color} fillOpacity="0.16" stroke="none" />
              <path d={path(s.ds, yf, false)} fill="none" stroke={s.color} strokeWidth="1.6" />
            </g>
          ) : (
            <path key={si} d={path(s.ds, yf, false)} fill="none" stroke={s.color} strokeWidth="2" />
          )
        })}
        {/* left axis labels */}
        <text x={PAD_L + 2} y={PAD_T + 10} fontSize="11" fill="#6b7886">{fmtAxis(leftMax)}</text>
        {rightSeries.length > 0 && (
          <text x={W - PAD_R - 2} y={PAD_T + 10} fontSize="11" fill="#6b7886" textAnchor="end">{fmtAxis(rightMax)}</text>
        )}
        {/* x labels (first / mid / last) */}
        {xLabels && xLabels.length > 0 && (
          <>
            <text x={PAD_L} y={H - 6} fontSize="11" fill="#6b7886">{xLabels[0]}</text>
            <text x={W / 2} y={H - 6} fontSize="11" fill="#6b7886" textAnchor="middle">{xLabels[Math.floor(xLabels.length / 2)]}</text>
            <text x={W - PAD_R} y={H - 6} fontSize="11" fill="#6b7886" textAnchor="end">{xLabels[xLabels.length - 1]}</text>
          </>
        )}
      </svg>
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.label} className="chart-key">
            <i style={{ background: s.color }} />
            {s.label}
            {s.axis === 'right' ? ' (rechts)' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
