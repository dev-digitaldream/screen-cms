import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

function getNestedValue(obj, path) {
  if (!path) return undefined
  return path.split('.').reduce((o, k) => {
    if (o === undefined || o === null) return undefined
    // Support array index: "items.0.name"
    return Array.isArray(o) ? o[parseInt(k, 10)] : o[k]
  }, obj)
}

function resolveItems(data, itemsPath) {
  if (!data) return []
  if (!itemsPath) return Array.isArray(data) ? data : []
  const val = getNestedValue(data, itemsPath)
  return Array.isArray(val) ? val : []
}

const PRIORITY_COLORS = {
  high:    { bg: 'rgba(239,68,68,.15)',  border: '#ef4444', text: '#fca5a5', dot: '#ef4444'  },
  medium:  { bg: 'rgba(245,158,11,.12)', border: '#f59e0b', text: '#fcd34d', dot: '#f59e0b'  },
  low:     { bg: 'rgba(34,197,94,.10)',  border: '#22c55e', text: '#86efac', dot: '#22c55e'  },
  default: { bg: 'rgba(255,255,255,.04)',border: 'rgba(255,255,255,.1)', text: '#a1a1aa', dot: '#52525b' },
}

const STATUS_ICONS = {
  open:       { icon: AlertCircle,   color: '#f59e0b' },
  'in-progress': { icon: Loader2,    color: '#6366f1' },
  closed:     { icon: CheckCircle2,  color: '#22c55e' },
  done:       { icon: CheckCircle2,  color: '#22c55e' },
  pending:    { icon: Clock,         color: '#a1a1aa' },
}

function normalise(val) {
  return typeof val === 'string' ? val.toLowerCase().replace(/[\s_]/g, '-') : ''
}

function PriorityDot({ value }) {
  const key = normalise(value)
  const c = PRIORITY_COLORS[key] || PRIORITY_COLORS.default
  return <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', backgroundColor: c.dot, flexShrink: 0 }} />
}

function StatusBadge({ value, size }) {
  const key = normalise(value)
  const def = STATUS_ICONS[key] || { icon: Clock, color: '#71717a' }
  const Icon = def.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: def.color, fontSize: size * 0.8 }}>
      <Icon size={size * 0.9} />
      {value}
    </span>
  )
}

// ── Widget ─────────────────────────────────────────────────────────────────

function TicketingWidget({ config, size }) {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const scrollRef = useRef(null)
  const scrollPos = useRef(0)

  const {
    datasourceId,
    itemsPath = '',
    fieldTitle = 'title',
    fieldStatus = 'status',
    fieldPriority = 'priority',
    fieldAssignee = 'assignee',
    fieldId = 'id',
    maxItems = 20,
    accentColor = '#6366f1',
    showHeader = true,
    headerTitle = 'Tickets',
    autoScroll = true,
    scrollSpeed = 40,    // px/s
    refresh_s = 30,
  } = config

  // ── Data loading ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!datasourceId) return
    let cancelled = false

    const load = () => {
      fetch(`/api/v1/datasources/${datasourceId}/data`)
        .then(r => r.json())
        .then(json => {
          if (cancelled) return
          if (json.error) { setError(json.error); return }
          const resolved = resolveItems(json.data, itemsPath)
          setItems(resolved.slice(0, maxItems))
          setLastFetch(json.fetchedAt)
          setError(null)
        })
        .catch(e => { if (!cancelled) setError(e.message) })
    }

    load()
    const t = setInterval(load, refresh_s * 1000)
    return () => { cancelled = true; clearInterval(t) }
  }, [datasourceId, itemsPath, maxItems, refresh_s])

  // ── Auto scroll ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return
    const el = scrollRef.current
    let raf
    let lastTime = null

    const step = (ts) => {
      if (!lastTime) lastTime = ts
      const dt = (ts - lastTime) / 1000
      lastTime = ts
      scrollPos.current += scrollSpeed * dt

      if (scrollPos.current > el.scrollHeight - el.clientHeight + 20) {
        scrollPos.current = 0
      }
      el.scrollTop = scrollPos.current
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, scrollSpeed, items])

  // ── Sizes ──────────────────────────────────────────────────────────────

  const headerH = showHeader ? Math.max(28, size.h * 0.10) : 0
  const labelSize = Math.max(9, Math.min(13, size.h / 20))
  const rowH = labelSize * 3.6

  // ── Empty / error states ───────────────────────────────────────────────

  if (!datasourceId) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, color: '#52525b', fontSize: 13 }}>
        Configurez une source de données
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      {showHeader && (
        <div style={{
          height: headerH, minHeight: headerH, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 12px',
          borderBottom: `1px solid rgba(255,255,255,.07)`,
          background: `linear-gradient(135deg, ${accentColor}22, rgba(255,255,255,.03))`,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: labelSize * 1.1, fontWeight: 600, color: '#e4e4e7', letterSpacing: '0.02em' }}>
            {headerTitle}
          </span>
          <span style={{ fontSize: labelSize * 0.85, color: '#52525b' }}>
            {items.length} ticket{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 12px', fontSize: 11, color: '#f87171', flexShrink: 0 }}>
          Erreur: {error}
        </div>
      )}

      {/* Rows */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'hidden', padding: '6px 8px' }}>
        {items.length === 0 && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#52525b', fontSize: labelSize }}>
            Aucun ticket
          </div>
        )}
        {items.map((item, i) => {
          const title    = getNestedValue(item, fieldTitle)    ?? `Item ${i + 1}`
          const status   = getNestedValue(item, fieldStatus)
          const priority = getNestedValue(item, fieldPriority)
          const assignee = getNestedValue(item, fieldAssignee)
          const id       = getNestedValue(item, fieldId)
          const prioKey  = normalise(priority)
          const prioC    = PRIORITY_COLORS[prioKey] || PRIORITY_COLORS.default

          return (
            <div key={i} style={{
              height: rowH, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 8px', marginBottom: 4, borderRadius: 8,
              background: prioC.bg,
              border: `1px solid ${prioC.border}`,
              flexShrink: 0,
            }}>
              <PriorityDot value={priority} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: labelSize, fontWeight: 500, color: '#e4e4e7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {id && <span style={{ color: '#52525b', marginRight: 6, fontSize: labelSize * 0.85 }}>#{typeof id === 'string' ? id.slice(0, 8) : id}</span>}
                  {String(title)}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: labelSize * 0.85, color: '#71717a', alignItems: 'center' }}>
                  {status && <StatusBadge value={String(status)} size={labelSize * 0.85} />}
                  {assignee && <span style={{ color: '#71717a' }}>{String(assignee)}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(TicketingWidget)
