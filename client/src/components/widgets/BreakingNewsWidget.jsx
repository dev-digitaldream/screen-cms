import { useState, useEffect, useRef } from 'react'
import React from 'react'

async function fetchFeed(url) {
  const r = await fetch(`/api/v1/rss?url=${encodeURIComponent(url)}`)
  const data = await r.json()
  return data.items || []
}

function BreakingNewsWidget({ config, size, display }) {
  const [queue, setQueue]       = useState([])
  const [current, setCurrent]   = useState(null)
  const [visible, setVisible]   = useState(false)
  const seenRef                 = useRef(new Set())
  const timersRef               = useRef([])

  const feedUrl    = config.feedUrl    || ''
  const refreshMin = config.refreshMinutes  || 10
  const displaySec = config.displaySeconds  || 12
  const pauseSec   = config.pauseSeconds    || 8
  const label      = config.label           || 'BREAKING'
  const labelColor = config.labelColor      || '#ef4444'
  const bgColor    = config.backgroundColor || '#ffffff'
  const textColor  = config.textColor       || '#111111'

  const clear = () => timersRef.current.forEach(clearTimeout)
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timersRef.current = [...timersRef.current.filter(Boolean), t]
    return t
  }

  // ── RSS polling ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!feedUrl) return

    const load = () => {
      fetchFeed(feedUrl).then(items => {
        const fresh = items.filter(it => {
          const id = it.guid || it.link || it.title
          return id && !seenRef.current.has(id)
        })
        if (fresh.length) {
          fresh.forEach(it => seenRef.current.add(it.guid || it.link || it.title))
          setQueue(prev => [...prev, ...fresh])
        }
      }).catch(() => {})
    }

    load()
    const iv = setInterval(load, refreshMin * 60 * 1000)
    return () => clearInterval(iv)
  }, [feedUrl, refreshMin])

  // ── Display queue ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (current || queue.length === 0) return

    const show = () => {
      const [next, ...rest] = queue
      setQueue(rest)
      setCurrent(next)
      later(() => setVisible(true), 60)
      later(() => {
        setVisible(false)
        later(() => setCurrent(null), 700)
      }, (displaySec + 0.06) * 1000)
    }

    const t = later(show, current === null ? pauseSec * 1000 : 0)
    return () => clearTimeout(t)
  }, [current, queue.length, displaySec, pauseSec])

  useEffect(() => () => clear(), [])

  // ── Editor preview ─────────────────────────────────────────────────────────
  if (!display) {
    return (
      <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'flex-end', padding: 8, boxSizing: 'border-box', borderRadius: 8, overflow: 'hidden' }}>
        <PopupCard
          label={label} labelColor={labelColor}
          title="Exemple — nouvelle info importante qui vient d'arriver !"
          bgColor={bgColor} textColor={textColor}
          size={size} visible
        />
      </div>
    )
  }

  if (!current) return null

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <PopupCard
        label={label} labelColor={labelColor}
        title={current.title}
        bgColor={bgColor} textColor={textColor}
        size={size} visible={visible}
      />
    </div>
  )
}

function PopupCard({ label, labelColor, title, bgColor, textColor, size, visible }) {
  const labelSize = Math.max(11, Math.min(size.h * 0.14, 16))
  const titleSize = Math.max(18, Math.min(size.h * 0.22, 36))

  return (
    <div style={{
      width: '100%',
      background: bgColor,
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 -6px 40px rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'stretch',
      transform: visible ? 'translateY(0)' : 'translateY(115%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
      willChange: 'transform, opacity',
    }}>
      {/* Accent stripe */}
      <div style={{ width: 5, background: labelColor, flexShrink: 0 }} />

      {/* Label badge */}
      <div style={{
        background: labelColor,
        padding: '0 14px',
        display: 'flex', alignItems: 'center',
        flexShrink: 0,
        gap: 6,
      }}>
        <span style={{
          display: 'inline-block',
          width: 7, height: 7,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          animation: 'bn-blink 1.1s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <span style={{
          color: '#fff',
          fontWeight: 800,
          fontSize: labelSize,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}>
          {label}
        </span>
      </div>

      {/* Title */}
      <div style={{ padding: `${Math.max(10, size.h * 0.12)}px 20px`, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        <p style={{
          margin: 0,
          color: textColor,
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.2,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {title}
        </p>
      </div>

      <style>{`@keyframes bn-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
    </div>
  )
}

export default React.memo(BreakingNewsWidget)
