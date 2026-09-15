import { useState, useEffect } from 'react'
import { Rss } from 'lucide-react'
import React from 'react'

function RssWidget({ config, size, display }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    const url = config.feedUrl
    if (!url) return

    fetch(`/api/v1/rss?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(data => {
        if (data.items?.length) setItems(data.items)
      })
      .catch(() => {})

    // Refresh every 10 minutes
    const interval = setInterval(() => {
      fetch(`/api/v1/rss?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(data => {
          if (data.items?.length) setItems(data.items)
        })
        .catch(() => {})
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [config.feedUrl])

  const maxItems = config.maxItems || 5
  const titleSize = Math.max(12, Math.min(size.h / 14, size.w / 18))
  const timeSize = Math.max(10, titleSize * 0.7)
  const headerSize = Math.max(11, titleSize * 0.75)
  const dotSize = Math.max(4, titleSize * 0.35)

  const st = config._style || {}
  const accentColor = config.accentColor || st.textColor || '#8b5cf6'
  const textColor = st.textColor || config.textColor || '#d4d4d8'
  const bgColor = st.backgroundColor || config.backgroundColor || 'rgba(255,255,255,.05)'
  const fontFamily = st.fontFamily ? `'${st.fontFamily}', sans-serif` : undefined
  const accentSoft = `${accentColor}80`
  const accentDot = `${accentColor}66`

  // Show placeholder if no feed URL configured
  if (!config.feedUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center rounded-xl p-4"
        style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,.08)', fontFamily }}>
        <Rss size={Math.min(size.w / 4, size.h / 3)} style={{ color: accentSoft }} />
        <p style={{ fontSize: headerSize, color: accentSoft, marginTop: 8 }}>Flux RSS</p>
        <p style={{ fontSize: timeSize, color: '#666', marginTop: 4 }}>Configurez l'URL du flux</p>
      </div>
    )
  }

  // Loading state
  if (!items) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-xl"
        style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #333', borderTopColor: accentColor, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const visibleItems = items.slice(0, maxItems)

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,.08)', fontFamily }}>
      <div className="flex items-center gap-2 flex-shrink-0"
        style={{ padding: `${Math.max(6, size.h / 20)}px ${Math.max(8, size.w / 20)}px`, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <Rss size={Math.max(10, headerSize * 0.9)} style={{ color: accentColor }} />
        <span style={{ fontSize: headerSize, fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {config.title || 'Actualités'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden" style={{ padding: `${Math.max(6, size.h / 25)}px ${Math.max(8, size.w / 20)}px` }}>
        {visibleItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2" style={{ paddingTop: i > 0 ? Math.max(4, size.h / 30) : 0, paddingBottom: Math.max(4, size.h / 30) }}>
            <div style={{ width: dotSize, height: dotSize, borderRadius: '50%', backgroundColor: accentDot, marginTop: titleSize * 0.35, flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: st.fontSize || titleSize, color: textColor, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.title}
              </p>
              {item.pubDate && (
                <p style={{ fontSize: timeSize, color: '#666', marginTop: 2 }}>
                  {formatDate(item.pubDate)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `Il y a ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `Il y a ${diffH}h`
    return d.toLocaleDateString('fr', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

export default React.memo(RssWidget)
