import { CalendarDays } from 'lucide-react'
import React from 'react'

function CalendarWidget({ config, size }) {
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  // Convert Sunday=0 to Monday=0 format
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: offset }, () => null)

  const cellSize = Math.max(12, Math.min((size.w - 24) / 9, (size.h - 60) / 9))
  const headerSize = Math.max(11, Math.min(size.h / 14, size.w / 16))
  const dayLabelSize = Math.max(9, cellSize * 0.55)
  const daySize = Math.max(10, cellSize * 0.6)

  const st = config._style || {}
  const accentColor = config.accentColor || st.textColor || '#fb7185'
  const textColor = st.textColor || config.textColor || '#fda4af'
  const bgColor = st.backgroundColor || config.backgroundColor || 'rgba(255,255,255,.05)'
  const fontFamily = st.fontFamily ? `'${st.fontFamily}', sans-serif` : undefined

  // Derive muted variants from accentColor for day labels & today highlight
  const accentMuted = `${accentColor}80`
  const accentBg = `${accentColor}40`
  const dayColor = `${textColor}b3`

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden p-3"
      style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,.08)', fontFamily }}>
      <div className="flex items-center gap-2 flex-shrink-0" style={{ marginBottom: cellSize * 0.4, paddingBottom: cellSize * 0.3, borderBottom: `1px solid ${accentMuted}` }}>
        <CalendarDays size={Math.max(12, headerSize)} style={{ color: accentColor }} />
        <span style={{ fontSize: headerSize, fontWeight: 600, color: textColor, textTransform: 'capitalize' }}>
          {today.toLocaleDateString('fr', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: Math.max(2, cellSize * 0.1) }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={`h-${i}`} style={{ textAlign: 'center', fontSize: dayLabelSize, fontWeight: 600, color: accentMuted, paddingBottom: cellSize * 0.15 }}>
            {d}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map(day => {
          const isToday = day === today.getDate()
          return (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: daySize,
              padding: `${cellSize * 0.12}px 0`,
              borderRadius: 4,
              color: isToday ? textColor : dayColor,
              backgroundColor: isToday ? accentBg : 'transparent',
              fontWeight: isToday ? 700 : 400,
            }}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(CalendarWidget)
