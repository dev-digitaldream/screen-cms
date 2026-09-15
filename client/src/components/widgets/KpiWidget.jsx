import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import React, { useEffect, useState } from 'react'

function KpiWidget({ config, size }) {
  // Live datasource binding
  const [liveData, setLiveData] = useState(null)
  useEffect(() => {
    if (!config.datasourceId || !config.datasourceField) return
    let cancelled = false
    const load = () => {
      fetch(`/api/v1/datasources/${config.datasourceId}/data`)
        .then(r => r.json())
        .then(json => {
          if (cancelled || !json.data) return
          const raw = json.data
          const val = config.datasourceField.split('.').reduce((o, k) => o?.[k], raw)
          if (val !== undefined) setLiveData(String(val))
        })
        .catch(() => {})
    }
    load()
    const t = setInterval(load, (config.refresh_s || 30) * 1000)
    return () => { cancelled = true; clearInterval(t) }
  }, [config.datasourceId, config.datasourceField, config.refresh_s])

  const displayValue = liveData ?? config.value

  const valueFontSize = Math.min(size.w / 3.5, size.h / 2.2)
  const labelFontSize = Math.max(10, Math.min(size.h / 8, size.w / 12))
  const trendFontSize = Math.max(10, valueFontSize * 0.28)
  const trendIconSize = Math.max(10, trendFontSize * 0.9)

  const st = config._style || {}
  const accentColor = config.accentColor || st.textColor || '#6366f1'
  const valueColor = st.textColor || config.valueColor || '#ffffff'
  const fontFamily = st.fontFamily ? `'${st.fontFamily}', sans-serif` : undefined

  const trendColor = config.trend === 'up'
    ? (config.upColor || '#34d399')
    : config.trend === 'down'
    ? (config.downColor || '#f87171')
    : '#a1a1aa'

  const bgStyle = config.showAccentBorder
    ? { backgroundColor: 'rgba(255,255,255,.05)', borderLeft: `4px solid ${accentColor}`, borderTop: '1px solid rgba(255,255,255,.08)', borderRight: '1px solid rgba(255,255,255,.08)', borderBottom: '1px solid rgba(255,255,255,.08)' }
    : { backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }

  const pt = config.paddingTop  ?? 16
  const pb = config.paddingBottom ?? 16
  const px = config.paddingX ?? 16
  const rowGap = config.rowGap ?? Math.round(valueFontSize * 0.08)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl"
      style={{ ...bgStyle, fontFamily, paddingTop: pt, paddingBottom: pb, paddingLeft: px, paddingRight: px, gap: rowGap }}>
      <div style={{
        fontSize: st.fontSize ? st.fontSize * 0.4 : labelFontSize,
        fontWeight: 500,
        color: config.labelColor || '#71717a',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textAlign: 'center',
      }}>
        {config.label || 'Indicateur'}
      </div>
      <div style={{
        fontSize: st.fontSize || valueFontSize,
        fontWeight: 700,
        color: valueColor,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}>
        {config.prefix}{displayValue || '—'}{config.unit}
      </div>
      {config.trendValue && (
        <div className="flex items-center" style={{
          fontSize: trendFontSize,
          fontWeight: 500,
          gap: 4,
          color: trendColor,
        }}>
          {config.trend === 'up' && <TrendingUp size={trendIconSize} />}
          {config.trend === 'down' && <TrendingDown size={trendIconSize} />}
          {config.trend === 'neutral' && <Minus size={trendIconSize} />}
          {config.trendValue}
        </div>
      )}
      {config.target && (
        <div style={{ fontSize: trendFontSize * 0.85, color: '#52525b' }}>
          Objectif: {config.target}
        </div>
      )}
    </div>
  )
}

export default React.memo(KpiWidget)
