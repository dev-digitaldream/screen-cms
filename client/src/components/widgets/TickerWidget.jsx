import React, { useEffect, useState, useRef } from 'react'

function TickerWidget({ config, size }) {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const [animDuration, setAnimDuration] = useState('30s')

  useEffect(() => {
    const SEP = '  •  '

    function buildSegments(rssItems) {
      const result = []
      if (rssItems.length > 0) {
        result.push({ text: rssItems.join(SEP), isAlert: false })
      }
      const freeText = (config.content || '').trim()
      if (freeText) {
        if (result.length > 0) result.push({ text: SEP, isAlert: false })
        result.push({ text: freeText, isAlert: false })
      }
      if (config.alertEnabled && config.alertText?.trim()) {
        result.push({ text: `  ⚡  ${config.alertText.trim()}  ⚡  `, isAlert: true })
      }
      if (result.length === 0) {
        result.push({ text: 'Bienvenue sur nos écrans • Informations en continu', isAlert: false })
      }
      return result
    }

    // Support old single rssUrl and new multi rssUrls (newline or comma separated)
    const rawUrls = config.rssUrls || config.rssUrl || ''
    const urls = rawUrls.split(/[\n,]+/).map(u => u.trim()).filter(Boolean)

    if (!config.rssEnabled || urls.length === 0) {
      setSegments(buildSegments([]))
      return
    }

    setLoading(true)
    let cancelled = false

    async function fetchAll() {
      const allTitles = []
      for (const url of urls) {
        try {
          const r = await fetch(`/api/v1/rss?url=${encodeURIComponent(url)}`)
          const d = await r.json()
          if (d.items?.length) allTitles.push(...d.items.map(i => i.title))
        } catch {}
      }
      if (!cancelled) {
        setSegments(buildSegments(allTitles))
        setLoading(false)
      }
    }

    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [
    config.rssEnabled, config.rssUrls, config.rssUrl,
    config.content, config.alertEnabled, config.alertText,
  ])

  useEffect(() => {
    if (!textRef.current || !containerRef.current) return
    const textWidth = textRef.current.scrollWidth
    const containerWidth = containerRef.current.offsetWidth
    const speed = config.speed || 1
    const totalDistance = textWidth + containerWidth
    const duration = Math.max(10, totalDistance / (80 * speed))
    setAnimDuration(`${duration}s`)
  }, [segments, config.speed, config.fontSize, size.w])

  const st = config._style || {}
  const textColor = st.textColor || config.textColor || '#FFFFFF'
  const bgColor = st.backgroundColor || config.backgroundColor || 'rgba(10, 10, 14, 0.9)'
  const fontFamily = st.fontFamily ? `'${st.fontFamily}', sans-serif` : undefined
  const fontSize = st.fontSize || config.fontSize || 20
  const alertColor = config.alertColor || '#f59e0b'

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center overflow-hidden rounded-xl relative"
      style={{ backgroundColor: bgColor }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, background: `linear-gradient(to right, ${bgColor}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: `linear-gradient(to left, ${bgColor}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />

      {loading && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>
          <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      <div
        ref={textRef}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          whiteSpace: 'nowrap',
          animation: `ticker-scroll ${animDuration} linear infinite`,
          paddingRight: '120px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {segments.map((seg, i) => (
          <span key={i} style={{
            color: seg.isAlert ? alertColor : textColor,
            fontWeight: seg.isAlert && config.alertBold ? 700 : 500,
          }}>
            {seg.text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(${size?.w || 1920}px); }
          to { transform: translateX(-100%); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default React.memo(TickerWidget)
