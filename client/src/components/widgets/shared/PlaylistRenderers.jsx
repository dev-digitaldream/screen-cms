/**
 * Shared renderers used by PlaylistWidget AND standalone widgets.
 * Each renderer receives a config-like object (called `item`) with the same
 * shape whether it comes from a playlist item or a standalone widget config.
 *
 * Standalone adapters at the bottom map widget config → item shape.
 */
import { useState, useEffect, useRef } from 'react'
import { onYTReady } from '@/lib/ytApi'

// ── Android TV Detection ───────────────────────────────────────────────────────
const isAndroidTV = typeof window !== 'undefined' && (
  /Android.*TV/.test(navigator.userAgent) ||
  /Chromecast/.test(navigator.userAgent) ||
  window.navigator.userAgent.includes('Android TV')
)

// Convert box-shadow to border fallback for Android TV
function getShadowFallback(shadow) {
  if (!shadow || !isAndroidTV) return shadow
  
  // Convert shadow to border for Android TV compatibility
  if (shadow.includes('rgba(99,102,241')) return '2px solid #6366f1' // indigo
  if (shadow.includes('rgba(16,185,129')) return '2px solid #10b981' // green  
  if (shadow.includes('rgba(245,158,11')) return '2px solid #f59e0b' // amber
  if (shadow.includes('rgba(239,68,68')) return '2px solid #ef4444'   // red
  return '1px solid rgba(0,0,0,0.2)' // default fallback
}

// ── Error placeholder ─────────────────────────────────────────────────────────

export function ItemError({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', color: '#6b7280', fontSize: 13,
      textAlign: 'center', padding: 24,
    }}>
      ⚠ {children}
    </div>
  )
}

// ── YouTube ───────────────────────────────────────────────────────────────────
// item: { url, muted, loop, captions, captionsLang }

export function YoutubeRenderer({ item }) {
  const divRef = useRef(null)
  const playerRef = useRef(null)
  const url = item.url || ''
  const isPlaylist = url.includes('list=')
  const listId = isPlaylist ? url.match(/list=([^&]+)/)?.[1] : null
  const vidId  = !isPlaylist ? url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] : null

  useEffect(() => {
    let destroyed = false
    function build() {
      if (destroyed || !divRef.current) return
      if (playerRef.current) { try { playerRef.current.destroy() } catch {} }
      const opts = {
        playerVars: {
          autoplay: 1, mute: item.muted !== false ? 1 : 0,
          controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3,
          playsinline: 1, origin: window.location.origin,
          cc_load_policy: item.captions ? 1 : 0,
          cc_lang_pref: item.captionsLang || 'fr',
        },
        events: {
          onReady: e => e.target.playVideo(),
          onError: e => console.warn('[YT]', e.data),
        },
      }
      if (vidId) {
        opts.videoId = vidId
        if (item.loop !== false) { opts.playerVars.loop = 1; opts.playerVars.playlist = vidId }
      } else if (listId) {
        opts.playerVars.listType = 'playlist'
        opts.playerVars.list = listId
        opts.playerVars.loop = 1
      }
      playerRef.current = new window.YT.Player(divRef.current, opts)
    }
    onYTReady(build)
    return () => {
      destroyed = true
      if (playerRef.current) { try { playerRef.current.destroy() } catch {} }
    }
  }, [url, item.loop, item.muted, item.captions, item.captionsLang])

  if (!vidId && !listId) return <ItemError>URL YouTube invalide</ItemError>
  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <div ref={divRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// ── Image (with optional text overlay) ───────────────────────────────────────
// item: { imageUrl, fit, overlayText, overlaySubtext, overlayFontSize,
//         overlayColor, overlaySubColor, overlayBg, overlayAlign, overlayVAlign, overlayBold }

export function ImageRenderer({ item }) {
  if (!item.imageUrl) return <ItemError>Aucune image sélectionnée</ItemError>
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src={item.imageUrl}
        alt={item.label || ''}
        style={{ width: '100%', height: '100%', objectFit: item.fit || 'cover', display: 'block' }}
      />
      {item.overlayText && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: item.overlayAlign || 'center',
          justifyContent: item.overlayVAlign === 'top' ? 'flex-start' : item.overlayVAlign === 'bottom' ? 'flex-end' : 'center',
          padding: '5%',
          background: item.overlayBg || 'rgba(0,0,0,0.35)',
        }}>
          <p style={{
            color: item.overlayColor || '#fff',
            fontSize: item.overlayFontSize || 48,
            fontWeight: item.overlayBold !== false ? 700 : 400,
            textAlign: item.overlayAlign === 'flex-start' ? 'left' : item.overlayAlign === 'flex-end' ? 'right' : 'center',
            lineHeight: 1.25, margin: 0, whiteSpace: 'pre-wrap',
            // textShadow: '0 2px 12px rgba(0,0,0,0.6)', // Disabled for Android TV WebView compatibility
          }}>
            {item.overlayText}
          </p>
          {item.overlaySubtext && (
            <p style={{
              color: item.overlaySubColor || 'rgba(255,255,255,0.75)',
              fontSize: (item.overlayFontSize || 48) * 0.45,
              fontWeight: 400, margin: '8px 0 0', textAlign: 'center',
            }}>
              {item.overlaySubtext}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Slideshow (multi-images) ──────────────────────────────────────────────────
// item: { images[], imageInterval, fit, showDots, caption }

export function SlideshowRenderer({ item, size }) {
  const images = item.images || []
  const [imgIdx, setImgIdx] = useState(0)
  const interval = Math.max(2, item.imageInterval || item.intervalSeconds || 5) * 1000
  const fit = item.fit || 'cover'
  const transition = item.transition || 'fade'

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setImgIdx(i => (i + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [images.length, interval])

  if (!images.length) return <ItemError>Aucune image dans le diaporama</ItemError>

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
      <style>{`
        @keyframes sh-fade  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sh-slide { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes sh-zoom  { from { opacity: 0; transform: scale(1.08) } to { opacity: 1; transform: scale(1) } }
      `}</style>
      {images.map((url, i) => (
        <img key={i} src={url} alt="" style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: fit, display: 'block',
          opacity: i === imgIdx ? 1 : 0,
          animation: i === imgIdx ? `sh-${transition} 0.6s ease both` : undefined,
          transition: transition === 'fade' ? 'opacity 0.6s ease' : undefined,
          zIndex: i === imgIdx ? 1 : 0,
        }} />
      ))}
      {item.showDots !== false && images.length > 1 && images.length <= 12 && (
        <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 5 }}>
          {images.map((_, i) => (
            <div key={i} style={{
              width: i === imgIdx ? 14 : 5, height: 5, borderRadius: 3,
              background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      )}
      {item.caption && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4,
          background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
          padding: '24px 16px 12px',
          color: '#fff',
          fontSize: Math.max(12, Math.min((size?.w || 400) / 32, 22)),
          fontWeight: 500,
        }}>
          {item.caption}
        </div>
      )}
    </div>
  )
}

// ── Video ─────────────────────────────────────────────────────────────────────
// item: { videoUrl, muted, loop, fit, startAt }

export function VideoRenderer({ item }) {
  const videoRef = useRef(null)
  if (!item.videoUrl) return <ItemError>Aucune vidéo sélectionnée</ItemError>

  const handleLoaded = () => {
    const v = videoRef.current
    if (!v) return
    if (item.startAt) v.currentTime = item.startAt
  }

  return (
    <video
      ref={videoRef}
      src={item.videoUrl}
      autoPlay muted={item.muted !== false} playsInline
      loop={item.loop !== false}
      onLoadedMetadata={handleLoaded}
      style={{ width: '100%', height: '100%', objectFit: item.fit || 'cover', display: 'block', background: '#000' }}
    />
  )
}

// ── Text message ──────────────────────────────────────────────────────────────
// item: { content, eyebrow, subtitle, textColor, backgroundColor, accentColor,
//         subtitleColor, fontFamily, fontSize, fontWeight, lineHeight, textAlign }

export function TextRenderer({ item, size }) {
  const fs = item.fontSize || Math.max(24, Math.min((size?.h || 200) / 4, 96))
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '10%', boxSizing: 'border-box',
      background: item.backgroundColor || '#0a0a0e',
      border: getShadowFallback(item.boxShadow),
    }}>
      {item.eyebrow && (
        <p style={{
          fontSize: fs * 0.35, color: item.accentColor || '#6366f1',
          fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          margin: '0 0 8px', fontFamily: item.fontFamily || 'inherit',
        }}>
          {item.eyebrow}
        </p>
      )}
      <p style={{
        fontSize: fs, color: item.textColor || '#ffffff',
        fontWeight: item.fontWeight || 600, lineHeight: item.lineHeight || 1.2,
        textAlign: item.textAlign || 'center',
        fontFamily: item.fontFamily || 'inherit',
        margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {item.content || 'Message'}
      </p>
      {item.subtitle && (
        <p style={{
          fontSize: fs * 0.4, color: item.subtitleColor || 'rgba(255,255,255,0.55)',
          fontWeight: 400, margin: '12px 0 0', textAlign: 'center',
          fontFamily: item.fontFamily || 'inherit',
        }}>
          {item.subtitle}
        </p>
      )}
    </div>
  )
}

// ── Google Slides ─────────────────────────────────────────────────────────────
// item: { url, autoAdvance, slideInterval }
// OR standalone config: { embedUrl, autoAdvance, intervalSeconds }

export function SlidesRenderer({ item }) {
  const rawUrl = item.url || item.embedUrl || ''
  if (!rawUrl) return <ItemError>URL Google Slides manquante</ItemError>

  const delayMs = (item.slideInterval || item.intervalSeconds || 5) * 1000
  let src = rawUrl
  
  // Convert to pubembed URL which works in iframes
  if (src.includes('docs.google.com/presentation')) {
    const base = src.replace(/\/pub\??.*$/, '').replace(/\/pubembed\??.*$/, '').replace(/\/embed\??.*$/, '').replace(/\/edit.*$/, '')
    // Use /pubembed with parameters for auto-advance
    src = `${base}/pubembed?start=${item.autoAdvance !== false ? 'false' : 'false'}&loop=${item.autoAdvance !== false ? 'true' : 'false'}&delayms=${delayMs}`
  } else if (!src.includes('/pubembed')) {
    src = src.replace('/pub', '/pubembed').replace('/embed', '/pubembed')
  }
  
  console.log('[Slides] Generated URL:', src)
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#fff' }}>
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff' }}
        allowFullScreen
        title={item.label || 'Slides'}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        onError={(e) => {
          console.error('[Slides] X-Frame-Options error detected')
          // Hide iframe and show fallback
          e.target.style.display = 'none'
          const fallback = e.target.parentElement.querySelector('.slides-fallback')
          if (fallback) fallback.style.display = 'flex'
        }}
        onLoad={() => console.log('[Slides] Loaded successfully:', src)}
      />
      
      {/* Fallback for X-Frame-Options error */}
      <div 
        className="slides-fallback" 
        style={{ 
          display: 'none', 
          position: 'absolute', 
          inset: 0, 
          background: '#f8f9fa', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '20px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '16px', color: '#5f6368' }}>📊</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#202124', fontSize: '16px' }}>Google Slides</h3>
        <p style={{ margin: '0 0 16px 0', color: '#5f6368', fontSize: '14px', maxWidth: '300px' }}>
          Google bloque l'affichage dans un iframe. Cliquez pour ouvrir dans un nouvel onglet.
        </p>
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#1a73e8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15,3 21,3 21,9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Ouvrir Google Slides
        </a>
      </div>
    </div>
  )
}

// ── PDF ───────────────────────────────────────────────────────────────────────
// item: { url, pageCount, pageInterval }

export function PdfRenderer({ item }) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, item.pageCount || 1)
  const interval = Math.max(3, item.pageInterval || 8)

  useEffect(() => { setPage(1) }, [item.url])

  useEffect(() => {
    if (pages <= 1) return
    const t = setInterval(() => setPage(p => p < pages ? p + 1 : 1), interval * 1000)
    return () => clearInterval(t)
  }, [pages, interval])

  if (!item.url) return <ItemError>URL PDF manquante</ItemError>
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        src={`${item.url}#page=${page}&toolbar=0&navpanes=0&scrollbar=0`}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff' }}
        title={item.label || 'PDF'}
      />
      {pages > 1 && (
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          fontSize: 11, padding: '2px 8px', borderRadius: 4, pointerEvents: 'none',
        }}>
          {page} / {pages}
        </div>
      )}
    </div>
  )
}

// ── Iframe / Looker Studio / Web ──────────────────────────────────────────────
// item: { url, scrollDir, scrollSpeed, contentHeight, contentWidth, zoom, background }

function toLookerEmbedUrl(url) {
  if (!url) return url
  // If URL already has /embed/, don't modify it
  if (url.includes('/embed/')) return url
  // Convert regular reporting URL to embed URL
  return url.replace(
    /lookerstudio\.google\.com\/reporting\//,
    'lookerstudio.google.com/embed/reporting/'
  )
}

export function IframeRenderer({ item }) {
  const containerRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !item.scrollDir || item.scrollDir === 'none') return
    const speed = Math.max(1, item.scrollSpeed || 50)
    let pos = 0, last = null, paused = false

    function step(ts) {
      if (!last) last = ts
      const dt = (ts - last) / 1000
      last = ts
      if (!paused) {
        pos += speed * dt
        if (item.scrollDir === 'vertical') {
          el.scrollTop = pos
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
            paused = true
            setTimeout(() => { pos = 0; el.scrollTop = 0; paused = false }, 2500)
          }
        } else {
          el.scrollLeft = pos
          if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 30) {
            paused = true
            setTimeout(() => { pos = 0; el.scrollLeft = 0; paused = false }, 2500)
          }
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [item.scrollDir, item.scrollSpeed])

  if (!item.url) return <ItemError>URL manquante</ItemError>

  const embedUrl = toLookerEmbedUrl(item.url)
  const zoom = item.zoom ? item.zoom / 100 : (item.scale ? item.scale / 100 : 1)
  const iW = item.scrollDir === 'horizontal' ? (item.contentWidth || 2400) : '100%'
  const iH = item.scrollDir === 'vertical'   ? (item.contentHeight || 2400) : '100%'

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', background: item.background || '#ffffff', position: 'relative' }}
    >
      <iframe
        src={embedUrl}
        style={{
          width: iW, height: iH,
          border: 'none', display: 'block',
          transformOrigin: 'top left',
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          pointerEvents: 'none',
        }}
        title={item.label || item.title || 'Web'}
        allowFullScreen
      />
    </div>
  )
}

// ── Generic item router (used by PlaylistWidget) ──────────────────────────────

export function ItemRenderer({ item, size }) {
  switch (item.type) {
    case 'youtube':   return <YoutubeRenderer item={item} />
    case 'image':     return <ImageRenderer item={item} />
    case 'slideshow': return <SlideshowRenderer item={item} size={size} />
    case 'video':     return <VideoRenderer item={item} />
    case 'text':      return <TextRenderer item={item} size={size} />
    case 'slides':    return <SlidesRenderer item={item} />
    case 'pdf':       return <PdfRenderer item={item} />
    case 'iframe':    return <IframeRenderer item={item} size={size} />
    default:          return <ItemError>Type inconnu : {item.type}</ItemError>
  }
}
