import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'
import React from 'react'

function CountdownWidget({ config, size }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    function calc() {
      const target = config.targetDate ? new Date(config.targetDate) : null
      if (!target || isNaN(target)) { setTimeLeft(null); return }
      const diff = target - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        done: false,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [config.targetDate])

  const numSize = Math.min(size.w / 5.5, size.h / 2.5)
  const labelSize = Math.max(9, numSize * 0.3)
  const titleSize = Math.max(11, numSize * 0.42)
  const accent = config.accentColor || '#6366f1'

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl p-3"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
      {config.title && (
        <div style={{ fontSize: titleSize, fontWeight: 600, color: '#a1a1aa', marginBottom: numSize * 0.18, textAlign: 'center', letterSpacing: '0.02em' }}>
          {config.title}
        </div>
      )}
      {!timeLeft ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Timer size={Math.min(size.w / 4, size.h / 3)} style={{ color: `${accent}60` }} />
          <p style={{ fontSize: titleSize * 0.85, color: '#71717a' }}>Configurez une date</p>
        </div>
      ) : timeLeft.done ? (
        <div style={{ fontSize: numSize * 0.9, fontWeight: 700, color: accent, textAlign: 'center' }}>
          {config.doneText || '🎉 Terminé !'}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: numSize * 0.12 }}>
          {timeLeft.days > 0 && <>
            <Unit value={timeLeft.days} label="jours" size={numSize} labelSize={labelSize} color={accent} />
            <Sep size={numSize} color={accent} />
          </>}
          <Unit value={timeLeft.hours} label="h" size={numSize} labelSize={labelSize} color={accent} />
          <Sep size={numSize} color={accent} />
          <Unit value={timeLeft.minutes} label="min" size={numSize} labelSize={labelSize} color={accent} />
          <Sep size={numSize} color={accent} />
          <Unit value={timeLeft.seconds} label="sec" size={numSize} labelSize={labelSize} color={accent} />
        </div>
      )}
    </div>
  )
}

function Unit({ value, label, size, labelSize, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        fontSize: size, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        padding: `${size * 0.08}px ${size * 0.14}px`,
        backgroundColor: 'rgba(255,255,255,.06)',
        borderRadius: size * 0.12,
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <span style={{ fontSize: labelSize, color: '#71717a', marginTop: 4 }}>{label}</span>
    </div>
  )
}

function Sep({ size, color }) {
  return <span style={{ fontSize: size * 0.75, fontWeight: 700, color, lineHeight: 1, paddingBottom: size * 0.2, opacity: 0.4 }}>:</span>
}

export default React.memo(CountdownWidget)
