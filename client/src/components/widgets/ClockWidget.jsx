import { useState, useEffect } from 'react'
import React from 'react'

function ClockWidget({ config, size }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const st = config._style || {}
  const primaryColor = st.textColor || config.textColor || '#ffffff'
  const secondaryColor = st.textColor ? `${st.textColor}99` : (config.secondaryColor || '#a1a1aa')
  const fontFamily = st.fontFamily ? `'${st.fontFamily}', monospace` : (config.fontFamily || 'JetBrains Mono, monospace')
  const bgColor = st.backgroundColor || config.backgroundColor || 'rgba(255,255,255,.05)'
  const autoSize = Math.min(size.w / 4.5, size.h / 2.2)
  const timeFontSize = st.fontSize || config.fontSize || autoSize
  const dateFontSize = Math.max(12, timeFontSize * 0.28)

  const tz = config.timezone || undefined
  const timeStr = config.format === '12h'
    ? time.toLocaleTimeString('en', { hour12: true, hour: '2-digit', minute: '2-digit', second: config.showSeconds ? '2-digit' : undefined, timeZone: tz })
    : time.toLocaleTimeString('fr', { hour12: false, hour: '2-digit', minute: '2-digit', second: config.showSeconds ? '2-digit' : undefined, timeZone: tz })

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl p-4"
      style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,.08)' }}>
      <span
        style={{ fontSize: timeFontSize, fontFamily, fontWeight: 600, color: primaryColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}
      >
        {timeStr}
      </span>
      {config.showDate && (
        <span style={{ fontSize: dateFontSize, color: secondaryColor, marginTop: timeFontSize * 0.12, textAlign: 'center', textTransform: 'capitalize' }}>
          {time.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz })}
        </span>
      )}
    </div>
  )
}

export default React.memo(ClockWidget)
