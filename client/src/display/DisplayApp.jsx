import { useEffect, useState, useRef, useCallback } from 'react'
import { onYTReady } from '@/lib/ytApi'
import BackgroundAnimation from '@/components/display/BackgroundAnimation'
import ClockWidget from '@/components/widgets/ClockWidget'
import WeatherWidget from '@/components/widgets/WeatherWidget'
import RssWidget from '@/components/widgets/RssWidget'
import KpiWidget from '@/components/widgets/KpiWidget'
import YoutubeWidget from '@/components/widgets/YoutubeWidget'
import TickerWidget from '@/components/widgets/TickerWidget'
import LogoWidget from '@/components/widgets/LogoWidget'
import StocksWidget from '@/components/widgets/StocksWidget'
import SlidesWidget from '@/components/widgets/SlidesWidget'
import QrCodeWidget from '@/components/widgets/QrCodeWidget'
import ImageWidget from '@/components/widgets/ImageWidget'
import TextWidget from '@/components/widgets/TextWidget'
import CalendarWidget from '@/components/widgets/CalendarWidget'
import VideoWidget from '@/components/widgets/VideoWidget'
import CountdownWidget from '@/components/widgets/CountdownWidget'
import ChartWidget from '@/components/widgets/ChartWidget'
import IframeWidget from '@/components/widgets/IframeWidget'
import SlideshowWidget from '@/components/widgets/SlideshowWidget'
import PlaylistWidget from '@/components/widgets/PlaylistWidget'
import TicketingWidget from '@/components/widgets/TicketingWidget'
import BreakingNewsWidget from '@/components/widgets/BreakingNewsWidget'

const WIDGET_RENDERERS = {
  clock: ClockWidget,
  weather: WeatherWidget,
  rss: RssWidget,
  kpi: KpiWidget,
  youtube: YoutubeWidget,
  ticker: TickerWidget,
  logo: LogoWidget,
  stocks: StocksWidget,
  slides: SlidesWidget,
  qrcode: QrCodeWidget,
  image: ImageWidget,
  text: TextWidget,
  calendar: CalendarWidget,
  video: VideoWidget,
  countdown: CountdownWidget,
  chart: ChartWidget,
  iframe: IframeWidget,
  slideshow: SlideshowWidget,
  playlist: PlaylistWidget,
  ticketing: TicketingWidget,
  'breaking-news': BreakingNewsWidget,
}

const ANIMATION_CSS = `
  @keyframes tl-fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes tl-slideLeft { from { opacity: 0; transform: translateX(-60px) } to { opacity: 1; transform: translateX(0) } }
  @keyframes tl-slideRight { from { opacity: 0; transform: translateX(60px) } to { opacity: 1; transform: translateX(0) } }
  @keyframes tl-slideUp { from { opacity: 0; transform: translateY(60px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes tl-slideDown { from { opacity: 0; transform: translateY(-60px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes tl-zoom { from { opacity: 0; transform: scale(0.8) } to { opacity: 1; transform: scale(1) } }
`

const RESOLUTIONS = {
  fhd:           { width: 1920, height: 1080 },
  hd:            { width: 1280, height:  720 },
  '4k':          { width: 3840, height: 2160 },
  portrait:      { width: 1080, height: 1920 },
  'portrait-hd': { width:  720, height: 1280 },
}

// Slug from window.__SLUG__ (injected by Express) or URL path
function getSlug() {
  if (window.__SLUG__) return window.__SLUG__
  const fromPath = window.location.pathname.match(/\/display\/([^/?#]+)/)?.[1]
  if (fromPath) return fromPath
  return new URLSearchParams(window.location.search).get('slug') || ''
}

// Token from window.__TOKEN__ (injected by Express) or ?t= param
function getToken() {
  if (window.__TOKEN__) return window.__TOKEN__
  return new URLSearchParams(window.location.search).get('t') || ''
}

function buildBackground(sc) {
  if (sc.backgroundType === 'gradient') {
    const c1 = sc.gradientColor1 || '#0a0a0e'
    const c2 = sc.gradientColor2 || '#1a2030'
    return { background: `linear-gradient(${sc.gradientDir || '135deg'}, ${c1}, ${c2})` }
  }
  if (sc.backgroundType === 'image' && sc.backgroundImage) {
    const fit = sc.backgroundFit || 'cover'
    return {
      backgroundImage: `url(${JSON.stringify(sc.backgroundImage)})`,
      backgroundSize: fit === 'contain' ? 'contain' : fit === 'fill' ? '100% 100%' : 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return { background: sc.backgroundColor || '#0a0a0e' }
}

export default function DisplayApp() {
  const slug = getSlug()
  const token = getToken()
  const [layout, setLayout] = useState(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const screenRef = useRef(null)

  // Fetch layout
  useEffect(() => {
    console.log('[Display] Starting with slug:', slug, 'token:', token ? '***' : 'none')
    if (!slug) { setError('Slug manquant'); return }
    const url = token ? `/api/v1/screens/${slug}?t=${encodeURIComponent(token)}` : `/api/v1/screens/${slug}`
    console.log('[Display] Fetching URL:', url)
    fetch(url)
      .then(r => { 
        console.log('[Display] Response status:', r.status)
        if (!r.ok) throw new Error(`Écran introuvable: ${slug}`); 
        return r.json() 
      })
      .then(data => {
        console.log('[Display] Layout loaded:', data)
        console.log('[Display] Widgets count:', data.widgets?.length || 0)
        setLayout(data)
      })
      .catch(e => {
        console.error('[Display] Error loading layout:', e)
        setError(e.message)
      })
  }, [slug, token])

  // Scale screen to viewport (includes rotation)
  useEffect(() => {
    if (!layout || !screenRef.current) return
    const res = RESOLUTIONS[layout.screenConfig?.resolution] || RESOLUTIONS.fhd
    const rotation = parseInt(layout.screenConfig?.rotation) || 0
    function scale() {
      const el = screenRef.current
      if (!el) return
      const s = Math.min(window.innerWidth / res.width, window.innerHeight / res.height)
      const ox = (window.innerWidth - res.width * s) / 2
      const oy = (window.innerHeight - res.height * s) / 2
      if (rotation) {
        el.style.transform = `translate(${ox}px, ${oy}px) scale(${s}) rotate(${rotation}deg)`
        el.style.transformOrigin = 'center center'
      } else {
        el.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`
      }
    }
    scale()
    // Show screen only after first scale+rotation is applied
    setReady(true)
    window.addEventListener('resize', scale)
    return () => window.removeEventListener('resize', scale)
  }, [layout])

  // Auto-refresh
  useEffect(() => {
    if (!layout) return
    const ms = (layout.screenConfig?.refreshInterval || 300) * 1000
    const t = setTimeout(() => window.location.reload(), ms)
    return () => clearTimeout(t)
  }, [layout])

  if (error) return (
    <div style={{ background: '#0a0a0e', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'monospace', textAlign: 'center', padding: 40 }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
        <div>{error}</div>
      </div>
    </div>
  )

  if (!layout) return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #333', borderTopColor: '#516076', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const { screenConfig: sc = {}, widgets = {}, widgetOrder = [] } = layout
  const res = RESOLUTIONS[sc.resolution] || RESOLUTIONS.fhd
  const bgStyle = buildBackground(sc)
  console.log('[Display] screenConfig.rotation:', sc.rotation, 'parsed:', parseInt(sc.rotation) || 0)
  
  // Calculate rotation transform
  const rotation = parseInt(sc.rotation) || 0
  const getRotationTransform = () => {
    switch (rotation) {
      case 90:
        return 'rotate(90deg) translateX(-100%)'
      case 180:
        return 'rotate(180deg)'
      case 270:
        return 'rotate(270deg) translateY(-100%)'
      default:
        return 'none'
    }
  }
  
  // Adjust dimensions for rotated screens
  const getRotatedDimensions = () => {
    if (rotation === 90 || rotation === 270) {
      return { width: res.height, height: res.width }
    }
    // For 0° and 180°, keep original dimensions
    return { width: res.width, height: res.height }
  }
  
  const rotatedDims = getRotatedDimensions()

  // Load custom font if needed
  const fontFamily = sc.fontFamily && sc.fontFamily !== 'system' ? sc.fontFamily : null
  const fontUrl = fontFamily
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`
    : null

  return (
    <div style={{ background: '#000', width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', inset: 0, fontFamily: fontFamily ? `'${fontFamily}', system-ui, sans-serif` : undefined }}>
      <style>{ANIMATION_CSS}</style>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      <div
        ref={screenRef}
        style={{
          position: 'absolute',
          width: res.width,
          height: res.height,
          overflow: 'hidden',
          transformOrigin: 'top left',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.3s ease',
          ...bgStyle,
        }}
      >
        <BackgroundAnimation
          type={sc.backgroundAnimation || 'none'}
          color={sc.backgroundColor || '#ffffff'}
          opacity={0.15}
        />
        {/* Widgets — même composants que l'éditeur */}
        {widgetOrder.map((id, index) => {
          try {
            const w = widgets[id]
            if (!w) {
              console.warn('[Display] Widget not found:', id)
              return null
            }
            const Renderer = WIDGET_RENDERERS[w.type]
            if (!Renderer) {
              console.warn('[Display] No renderer for widget type:', w.type, 'id:', id)
              return null
            }
            
            console.log('[Display] Rendering widget:', id, 'type:', w.type)
            const anim = w.config?.animation || 'none'
            const delay = w.config?.animationDelay || 0
            const opacity = w.config?.opacity !== undefined ? w.config.opacity : 1
            
            return (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: w.x,
                  top: w.y,
                  width: w.w,
                  height: w.h,
                  zIndex: index + 1,
                  overflow: 'hidden',
                  opacity,
                  animation: anim !== 'none' ? `tl-${anim} 0.8s ease-out ${delay}s both` : undefined,
                }}
              >
                <Renderer config={w.config || {}} size={{ w: w.w, h: w.h }} display />
              </div>
            )
          } catch (err) {
            console.error('[Display] Error rendering widget:', id, err)
            return (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 200,
                  height: 100,
                  background: 'red',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  zIndex: 9999,
                }}
              >
                ERROR: {id}
              </div>
            )
          }
        })}

        {/* Timeline overlay */}
        {sc.timelineEnabled && sc.timelineItems?.length > 0 && (
          <TimelineOverlay items={sc.timelineItems} />
        )}
      </div>
    </div>
  )
}

// ── Timeline overlay ──────────────────────────────────────────────────────

function isScheduledNow(item) {
  if (!item.scheduleEnabled) return true
  const now = new Date()
  const day = now.getDay() || 7 // 1=Mon..7=Sun
  const days = item.scheduleDays || [1, 2, 3, 4, 5]
  if (!days.includes(day)) return false
  const hm = now.getHours() * 60 + now.getMinutes()
  const parseT = t => { const [h, m] = (t || '00:00').split(':'); return parseInt(h) * 60 + (parseInt(m) || 0) }
  return hm >= parseT(item.scheduleStart || '00:00') && hm < parseT(item.scheduleEnd || '23:59')
}

function TimelineOverlay({ items }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(false)
  const [fade, setFade] = useState(false)
  const [playlistIdx, setPlaylistIdx] = useState(0)
  const timerRef = useRef(null)
  const plTimerRef = useRef(null)

  const advance = useCallback((currentIdx) => {
    clearTimeout(timerRef.current)
    clearInterval(plTimerRef.current)

    // Find next scheduled item
    let next = -1
    for (let i = 0; i < items.length; i++) {
      const candidate = (currentIdx + i) % items.length
      if (isScheduledNow(items[candidate])) { next = candidate; break }
    }

    if (next === -1) {
      setVisible(false)
      timerRef.current = setTimeout(() => advance(currentIdx), 60_000)
      return
    }

    const item = items[next]
    setIdx(next)
    setPlaylistIdx(0)

    // Crossfade in
    setVisible(item.type !== 'layout')
    setFade(false)
    setTimeout(() => setFade(true), 30)

    const infinite = (item.type === 'youtube' && item.loop) || (item.type === 'video' && item.loop)
    const dur = infinite ? 3_600_000 : (item.durationSec || 30) * 1000

    // Playlist cycling
    if (item.type === 'playlist' && item.images?.length > 1) {
      const interval = (item.intervalSec || 8) * 1000
      plTimerRef.current = setInterval(() => {
        setPlaylistIdx(p => (p + 1) % item.images.length)
      }, interval)
    }

    timerRef.current = setTimeout(() => {
      // Fade out then advance
      setFade(false)
      setTimeout(() => advance(next + 1), 600)
    }, dur)
  }, [items])

  useEffect(() => {
    const t = setTimeout(() => advance(0), 2000)
    return () => { clearTimeout(t); clearTimeout(timerRef.current); clearInterval(plTimerRef.current) }
  }, [advance])

  if (!visible) return null

  const item = items[idx]
  if (!item || item.type === 'layout') return null

  const isEmergency = item.type === 'emergency'

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 9999,
        background: isEmergency ? '#dc2626' : '#000',
        opacity: fade ? 1 : 0,
        transition: 'opacity 0.6s ease',
        animation: isEmergency ? 'tl-pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      <style>{`@keyframes tl-pulse{0%,100%{background:#dc2626}50%{background:#b91c1c}}`}</style>

      {item.type === 'youtube' && <YoutubeOverlay item={item} />}
      {item.type === 'video' && <VideoOverlay item={item} />}
      {item.type === 'slides' && <iframe src={item.embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Slides" />}
      {item.type === 'image' && <img src={item.imageUrl} style={{ width: '100%', height: '100%', objectFit: item.fit || 'cover', display: 'block' }} alt="" />}
      {item.type === 'playlist' && item.images?.length > 0 && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {item.images.map((url, i) => (
            <img key={i} src={url} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: i === playlistIdx ? 1 : 0, transition: 'opacity 0.6s ease',
            }} />
          ))}
        </div>
      )}
      {item.type === 'emergency' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '5vw', fontWeight: 800, color: '#fff', textAlign: 'center', padding: 40, lineHeight: 1.3, fontFamily: 'Inter, system-ui, sans-serif' }}>
          🚨 {item.message || 'URGENCE'}
        </div>
      )}
    </div>
  )
}

function YoutubeOverlay({ item }) {
  const divRef = useRef(null)
  const playerRef = useRef(null)

  const url = item.url || ''
  const isPlaylist = url.includes('list=')
  const listId = isPlaylist ? url.match(/list=([^&]+)/)?.[1] : null
  const vidId = !isPlaylist ? url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] : null

  // Reuse the same YT API loader from YoutubeWidget
  useEffect(() => {
    let destroyed = false

    function buildPlayer() {
      if (destroyed || !divRef.current) return
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }

      const opts = {
        playerVars: {
          autoplay: 1,
          mute: item.muted !== false ? 1 : 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => { e.target.playVideo() },
          onError: (e) => { console.warn('[YT Timeline] error', e.data) },
        },
      }
      if (vidId) {
        opts.videoId = vidId
        if (item.loop !== false) {
          opts.playerVars.loop = 1
          opts.playerVars.playlist = vidId
        }
      } else if (listId) {
        opts.playerVars.listType = 'playlist'
        opts.playerVars.list = listId
        opts.playerVars.loop = 1
      }
      playerRef.current = new window.YT.Player(divRef.current, opts)
    }

    onYTReady(buildPlayer)

    return () => {
      destroyed = true
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }
    }
  }, [url])

  if (!vidId && !listId) {
    return (
      <div style={{ color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 24 }}>
        ⚠ URL YouTube invalide
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <div ref={divRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

function VideoOverlay({ item }) {
  if (!item.videoUrl) return null
  return (
    <video
      src={item.videoUrl}
      autoPlay muted playsInline
      loop={item.loop !== false}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' }}
    />
  )
}
