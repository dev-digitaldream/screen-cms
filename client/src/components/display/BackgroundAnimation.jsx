import { useEffect, useRef, useState } from 'react'

const ANIMATIONS = {
  none: null,
  topographic: 'Topographique',
  particles: 'Particules',
  waves: 'Ondes',
  grid: 'Grille',
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16) || 255,
    g: parseInt(h.substring(2, 4), 16) || 255,
    b: parseInt(h.substring(4, 6), 16) || 255,
  }
}

export function BackgroundAnimation({ type, color = '#ffffff', opacity = 0.08 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!type || type === 'none' || hasError) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      console.log('[BgAnim] Starting:', type, 'color:', color, 'opacity:', opacity)
      const resize = () => {
        const parent = canvas.parentElement
        canvas.width = parent ? parent.clientWidth : 1920
        canvas.height = parent ? parent.clientHeight : 1080
        console.log('[BgAnim] Canvas size:', canvas.width, 'x', canvas.height)
      }
      resize()
      window.addEventListener('resize', resize)

      const rgb = hexToRgb(color)
      const fns = { topographic: topoAnim, particles: particleAnim, waves: waveAnim, grid: gridAnim }
      const stop = (fns[type] || fns.topographic)(ctx, canvas, rgb, opacity, rafRef)

      return () => {
        window.removeEventListener('resize', resize)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        if (stop) stop()
      }
    } catch (e) {
      console.error('[BgAnim]', e)
      setHasError(true)
    }
  }, [type, color, opacity, hasError])

  if (!type || type === 'none' || hasError) return null

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  )
}

// ─── Topographic contour lines (slow drift) ───
function topoAnim(ctx, canvas, rgb, opacity, rafRef) {
  let t = 0
  const spacing = 60
  const layers = 12

  function noise(x, y, z) {
    const s = Math.sin(x * 0.8 + z * 0.3) * 0.5 + Math.sin(y * 0.6 - z * 0.2) * 0.5
    const d = Math.sin(x * 0.3 - y * 0.4 + z * 0.15) * 0.4
    return s + d
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const w = canvas.width, h = canvas.height

    for (let layer = 0; layer < layers; layer++) {
      const threshold = -1 + (layer / layers) * 2
      const alpha = opacity * (0.4 + 0.6 * (layer / layers))
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
      ctx.lineWidth = 0.8
      ctx.beginPath()

      // March along a grid and connect contour points
      const step = 18
      for (let y = 0; y < h; y += step) {
        let drawing = false
        for (let x = 0; x < w; x += 4) {
          const v = noise(x / spacing, y / spacing, t)
          const diff = Math.abs(v - threshold)
          if (diff < 0.08) {
            const py = y + Math.sin(x * 0.02 + t * 0.5 + layer) * 3
            if (!drawing) { ctx.moveTo(x, py); drawing = true }
            else ctx.lineTo(x, py)
          } else {
            drawing = false
          }
        }
      }
      ctx.stroke()
    }

    t += 0.003
    rafRef.current = requestAnimationFrame(draw)
  }
  draw()
}

// ─── Floating particles with connections ───
function particleAnim(ctx, canvas, rgb, opacity, rafRef) {
  const count = 40
  const pts = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 2 + 1,
  }))

  function draw() {
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)

    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
    })

    // Lines between close particles
    ctx.lineWidth = 0.5
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const a = opacity * (1 - dist / 150)
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
          ctx.beginPath()
          ctx.moveTo(pts[i].x, pts[i].y)
          ctx.lineTo(pts[j].x, pts[j].y)
          ctx.stroke()
        }
      }
    }

    // Dots
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity * 2})`
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill() })

    rafRef.current = requestAnimationFrame(draw)
  }
  draw()
}

// ─── Sine waves ───
function waveAnim(ctx, canvas, rgb, opacity, rafRef) {
  let t = 0

  function draw() {
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.lineWidth = 1

    for (let i = 0; i < 6; i++) {
      const alpha = opacity * (0.3 + i * 0.12)
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
      ctx.beginPath()
      const baseY = h * 0.2 + i * (h * 0.12)
      for (let x = 0; x <= w; x += 3) {
        const y = baseY +
          Math.sin(x * 0.005 + t + i * 0.8) * 30 +
          Math.sin(x * 0.01 - t * 0.7 + i) * 15
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    t += 0.008
    rafRef.current = requestAnimationFrame(draw)
  }
  draw()
}

// ─── Pulsing grid ───
function gridAnim(ctx, canvas, rgb, opacity, rafRef) {
  let t = 0
  const spacing = 50

  function draw() {
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.lineWidth = 0.5

    const cols = Math.ceil(w / spacing) + 1
    const rows = Math.ceil(h / spacing) + 1

    for (let i = 0; i < cols; i++) {
      const a = opacity * (0.3 + Math.sin(t + i * 0.15) * 0.25)
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
      ctx.beginPath(); ctx.moveTo(i * spacing, 0); ctx.lineTo(i * spacing, h); ctx.stroke()
    }
    for (let i = 0; i < rows; i++) {
      const a = opacity * (0.3 + Math.sin(t + i * 0.15 + 1) * 0.25)
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
      ctx.beginPath(); ctx.moveTo(0, i * spacing); ctx.lineTo(w, i * spacing); ctx.stroke()
    }

    // Glow at intersections
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const pulse = Math.sin(t * 1.5 + i * 0.3 + j * 0.3) * 0.5 + 0.5
        if (pulse > 0.7) {
          const a = opacity * pulse * 1.5
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
          ctx.beginPath(); ctx.arc(i * spacing, j * spacing, 2, 0, Math.PI * 2); ctx.fill()
        }
      }
    }

    t += 0.01
    rafRef.current = requestAnimationFrame(draw)
  }
  draw()
}

export { ANIMATIONS }
export default BackgroundAnimation
