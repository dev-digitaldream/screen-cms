import React from 'react'
import { BarChart2 } from 'lucide-react'

function ChartWidget({ config, size }) {
  const title = config.title || 'Statistiques'
  const rawData = config.data || 'Jan:120,Fév:180,Mar:150,Avr:200,Mai:175,Jun:220'
  const barColor = config.barColor || '#6366f1'
  const chartType = config.chartType || 'bar'

  const items = rawData.split(',').map(entry => {
    const [label, value] = entry.split(':')
    return { label: (label || '').trim(), value: parseFloat(value) || 0 }
  }).filter(i => i.label)

  const titleSize = Math.max(11, size.h * 0.1)
  const labelSize = Math.max(8, Math.min(titleSize * 0.7, (size.w - 32) / items.length / 1.2))
  const valueSize = Math.max(7, labelSize * 0.85)
  const headerH = titleSize + 12
  const chartH = size.h - headerH - 32
  const maxVal = Math.max(...items.map(i => i.value), 1)

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: 12 }}>
      <div style={{ fontSize: titleSize, fontWeight: 600, color: '#d4d4d8', marginBottom: 8, flexShrink: 0 }}>
        {title}
      </div>

      {chartType === 'bar' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 4, paddingBottom: labelSize * 1.6 + 4 }}>
          {items.map((item, i) => {
            const barH = Math.max(4, (item.value / maxVal) * (chartH - labelSize * 2 - valueSize))
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: valueSize, color: '#a1a1aa', marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
                  {item.value % 1 === 0 ? item.value : item.value.toFixed(1)}
                </span>
                <div style={{
                  width: '65%', height: barH,
                  background: `linear-gradient(to top, ${barColor}, ${barColor}99)`,
                  borderRadius: '3px 3px 0 0', minHeight: 4,
                }} />
                <span style={{ fontSize: labelSize, color: '#71717a', marginTop: 4, textAlign: 'center', lineHeight: 1 }}>{item.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {chartType === 'line' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <LinePath items={items} maxVal={maxVal} color={barColor} chartH={chartH} labelSize={labelSize} valueSize={valueSize} />
        </div>
      )}

      {chartType === 'donut' && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <DonutChart items={items} colors={[barColor, '#22d3ee', '#f59e0b', '#34d399', '#f87171', '#a78bfa']} size={Math.min(size.w, chartH + 32) * 0.7} labelSize={labelSize} />
        </div>
      )}
    </div>
  )
}

function LinePath({ items, maxVal, color, chartH, labelSize, valueSize }) {
  const w = 100
  const h = 100
  const pad = 10
  const pts = items.map((item, i) => ({
    x: pad + (i / Math.max(items.length - 1, 1)) * (w - pad * 2),
    y: pad + (1 - item.value / maxVal) * (h - pad * 2),
    label: item.label,
    value: item.value,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const fillD = `${pathD} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

function DonutChart({ items, colors, size, labelSize }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  const r = size / 2 * 0.7
  const cx = size / 2, cy = size / 2
  const strokeW = size * 0.18

  let cumAngle = -90
  const arcs = items.map((item, i) => {
    const pct = item.value / total
    const angle = pct * 360
    const start = cumAngle
    cumAngle += angle
    return { ...item, pct, startAngle: start, endAngle: cumAngle, color: colors[i % colors.length] }
  })

  function arcPath(startDeg, endDeg, r, cx, cy) {
    const toRad = deg => deg * Math.PI / 180
    const x1 = cx + r * Math.cos(toRad(startDeg))
    const y1 = cy + r * Math.sin(toRad(startDeg))
    const x2 = cx + r * Math.cos(toRad(endDeg))
    const y2 = cy + r * Math.sin(toRad(endDeg))
    const large = (endDeg - startDeg) > 180 ? 1 : 0
    return `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`
  }

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {arcs.map((arc, i) => (
        <path key={i} d={arcPath(arc.startAngle, arc.endAngle, r, cx, cy)}
          fill="none" stroke={arc.color} strokeWidth={strokeW}
          strokeLinecap="butt" opacity={0.85} />
      ))}
      {/* Center text */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size * 0.15, fontWeight: 700, fill: '#fff' }}>
        {items.length}
      </text>
      <text x={cx} y={cy + size * 0.12} textAnchor="middle"
        style={{ fontSize: size * 0.08, fill: '#71717a' }}>
        séries
      </text>
    </svg>
  )
}

export default React.memo(ChartWidget)
