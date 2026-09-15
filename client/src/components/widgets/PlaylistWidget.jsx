import { useState, useEffect, useRef, useCallback } from 'react'
import { Layers } from 'lucide-react'
import { ItemRenderer } from './shared/PlaylistRenderers'

export const PLAYLIST_ITEM_TYPES = [
  { value: 'youtube',   label: 'YouTube',                emoji: '▶'  },
  { value: 'image',     label: 'Image',                  emoji: '🖼' },
  { value: 'slideshow', label: 'Diaporama (multi-images)',emoji: '🎞' },
  { value: 'video',     label: 'Vidéo locale',           emoji: '🎬' },
  { value: 'text',      label: 'Message texte',          emoji: '💬' },
  { value: 'slides',    label: 'Google Slides',          emoji: '📊' },
  { value: 'pdf',       label: 'PDF',                    emoji: '📄' },
  { value: 'iframe',    label: 'Page Web / Looker Studio',emoji: '🌐' },
]

// ── Schedule helper ───────────────────────────────────────────────────────────
function isItemScheduled(item) {
  if (!item.scheduleEnabled) return true
  const now = new Date()
  const hm = now.getHours() * 60 + now.getMinutes()
  const days = item.scheduleDays || [0,1,2,3,4,5,6]
  if (!days.includes(now.getDay())) return false
  const parseT = s => { const [h,m] = (s||'00:00').split(':').map(Number); return h*60+m }
  return hm >= parseT(item.scheduleStart) && hm < parseT(item.scheduleEnd)
}

function getScheduledItems(items) {
  return items.filter(isItemScheduled)
}

// ── Transition CSS helper ─────────────────────────────────────────────────────
const TRANSITION_DURATION = 600 // ms

function getTransitionStyle(transition, phase) {
  // phase: 'in' | 'out'
  const t = transition || 'fade'
  const visible = phase === 'in'
  const base = { transition: `all ${TRANSITION_DURATION}ms ease`, position: 'absolute', inset: 0 }
  switch (t) {
    case 'slide-left':
      return { ...base, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-40px)' }
    case 'slide-right':
      return { ...base, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(40px)' }
    case 'zoom':
      return { ...base, opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(1.08)' }
    case 'none':
      return { ...base, opacity: 1 }
    case 'fade':
    default:
      return { ...base, opacity: visible ? 1 : 0 }
  }
}

export default function PlaylistWidget({ config, size }) {
  const allItems = config?.items || []
  const transition = config?.transition || 'fade'
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('in') // 'in' | 'out'
  const timerRef = useRef(null)
  const idxRef = useRef(0)

  // Only show items that pass schedule filter
  const items = getScheduledItems(allItems)

  const advance = useCallback((currentIdx) => {
    if (items.length <= 1) return
    setPhase('out')
    setTimeout(() => {
      const next = (currentIdx + 1) % items.length
      idxRef.current = next
      setIdx(next)
      setPhase('in')
    }, TRANSITION_DURATION)
  }, [items.length])

  useEffect(() => {
    if (!items.length) return
    const item = items[idx]
    if (!item) return
    clearTimeout(timerRef.current)
    const isInfinite = (item.type === 'youtube' || item.type === 'video') && item.loop
    if (isInfinite) return
    const dur = Math.max(3, item.duration || 30) * 1000
    timerRef.current = setTimeout(() => advance(idxRef.current), dur)
    return () => clearTimeout(timerRef.current)
  }, [idx, items, advance])

  // Reset index when playlist items change
  useEffect(() => {
    idxRef.current = 0
    setIdx(0)
    setPhase('in')
  }, [items.length])

  if (!items.length) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#111827', color: '#4b5563',
        gap: 8, borderRadius: 'inherit',
      }}>
        <Layers size={28} />
        <span style={{ fontSize: 12, textAlign: 'center', padding: '0 20px', lineHeight: 1.5 }}>
          {allItems.length > 0 ? 'Aucun item programmé en ce moment' : 'Playlist vide — Ajoutez des items'}
        </span>
      </div>
    )
  }

  const item = items[idx] || items[0]
  const isInfinite = (item.type === 'youtube' || item.type === 'video') && item.loop

  // Identify iframe items that need preloading
  const iframeItems = items.filter(it => it.type === 'iframe' || it.type === 'slides')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000', borderRadius: 'inherit' }}>
      {/* Preload all iframe/web items in hidden layers so they're ready instantly */}
      {iframeItems.map((it, i) => {
        const isActive = (it.id || i) === (item.id || idx) && it.type === item.type
        return (
          <div
            key={`preload-${it.id || i}`}
            style={{
              position: 'absolute', inset: 0,
              zIndex: isActive ? 2 : -1,
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
              transition: `opacity ${TRANSITION_DURATION}ms ease`,
            }}
          >
            <ItemRenderer item={it} size={size} />
          </div>
        )
      })}

      {/* Active non-iframe content with configurable transition */}
      {item.type !== 'iframe' && item.type !== 'slides' && (
        <div
          key={`${item.id || idx}-content`}
          style={{ ...getTransitionStyle(transition, phase), zIndex: 3 }}
        >
          <ItemRenderer item={item} size={size} />
        </div>
      )}

      {/* Progress bar */}
      {items.length > 1 && !isInfinite && (
        <ProgressBar key={`pb-${idx}`} item={item} />
      )}

      {/* Navigation dots (only if ≤ 12 items) */}
      {items.length > 1 && items.length <= 12 && (
        <div style={{
          position: 'absolute', bottom: 10, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 5,
          zIndex: 10, pointerEvents: 'none',
        }}>
          {items.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
              background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}

      {/* Item label badge */}
      {item.label && (
        <div style={{
          position: 'absolute', top: 8, left: 10, zIndex: 10, pointerEvents: 'none',
          fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500,
          background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4,
          backdropFilter: 'blur(4px)',
        }}>
          {item.label}
        </div>
      )}
    </div>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ item }) {
  const isInfinite = (item.type === 'youtube' || item.type === 'video') && item.loop
  if (isInfinite) return null
  const dur = Math.max(3, item.duration || 30)
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.12)', zIndex: 10, pointerEvents: 'none' }}>
      <div style={{ height: '100%', background: 'rgba(255,255,255,0.75)', animation: `pl-prog ${dur}s linear forwards` }} />
      <style>{`@keyframes pl-prog{from{width:0}to{width:100%}}`}</style>
    </div>
  )
}

