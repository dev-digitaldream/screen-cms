import { useRef, useEffect, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { SCREEN_RESOLUTIONS, CANVAS_PADDING } from '@/lib/constants'
import ScreenFrame from './ScreenFrame'
import { ZoomOut, ZoomIn, Grid3x3, Magnet, Eye, Pencil } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'

function Canvas() {
  const zoom = useEditorStore(s => s.zoom)
  const snapEnabled = useEditorStore(s => s.snapEnabled)
  const gridVisible = useEditorStore(s => s.gridVisible)
  const slug = useEditorStore(s => s.screenConfig.slug)
  const resolution = useEditorStore(s => SCREEN_RESOLUTIONS[s.screenConfig.resolution])
  const canvasRef = useRef(null)
  const [previewMode, setPreviewMode] = useState(false)

  // Zoom with Ctrl+Wheel
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function handleWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      const store = useEditorStore.getState()
      store.setZoom(store.zoom * factor)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])

  const setZoom = useEditorStore(s => s.setZoom)
  const toggleSnap = useEditorStore(s => s.toggleSnapToGrid)
  const toggleGrid = useEditorStore(s => s.toggleGridVisible)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Canvas toolbar */}
      <div
        className="h-9 px-3 flex items-center justify-between gap-2 flex-shrink-0"
        style={{ backgroundColor: 'var(--surface-lowest)', boxShadow: '0 1px 0 var(--border-ghost)' }}
      >
        {/* Left: mode toggle */}
        <div className="flex items-center gap-0.5">
          <Tooltip content="Mode édition">
            <button
              onClick={() => setPreviewMode(false)}
              className="btn-ghost px-2 py-1 text-[11px] font-medium flex items-center gap-1"
              style={!previewMode ? { color: 'var(--steel)', backgroundColor: 'var(--steel-light)' } : {}}
            >
              <Pencil size={12} /> Éditer
            </button>
          </Tooltip>
          <Tooltip content="Prévisualisation live">
            <button
              onClick={() => setPreviewMode(true)}
              className="btn-ghost px-2 py-1 text-[11px] font-medium flex items-center gap-1"
              style={previewMode ? { color: 'var(--steel)', backgroundColor: 'var(--steel-light)' } : {}}
            >
              <Eye size={12} /> Aperçu
            </button>
          </Tooltip>
        </div>

        {/* Right: zoom + grid controls (hidden in preview) */}
        {!previewMode && (
          <div className="flex items-center gap-1">
            <Tooltip content="Dézoomer">
              <button onClick={() => setZoom(zoom / 1.2)} className="btn-ghost p-1.5">
                <ZoomOut size={14} />
              </button>
            </Tooltip>
            <button
              onClick={() => setZoom(0.5)}
              className="text-[11px] font-mono px-2 py-0.5 rounded transition-colors"
              style={{ backgroundColor: 'var(--surface-high)', color: 'var(--ink-muted)' }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <Tooltip content="Zoomer">
              <button onClick={() => setZoom(zoom * 1.2)} className="btn-ghost p-1.5">
                <ZoomIn size={14} />
              </button>
            </Tooltip>

            <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--surface-highest)' }} />

            <Tooltip content={`Magnétisme ${snapEnabled ? 'activé' : 'désactivé'} (S)`}>
              <button
                onClick={toggleSnap}
                className="btn-ghost p-1.5"
                style={snapEnabled ? { color: 'var(--steel)', backgroundColor: 'var(--steel-light)' } : {}}
              >
                <Magnet size={14} />
              </button>
            </Tooltip>
            <Tooltip content={`Grille ${gridVisible ? 'visible' : 'masquée'} (G)`}>
              <button
                onClick={toggleGrid}
                className="btn-ghost p-1.5"
                style={gridVisible ? { color: 'var(--steel)', backgroundColor: 'var(--steel-light)' } : {}}
              >
                <Grid3x3 size={14} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Canvas scroll area */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto"
        style={{
          backgroundImage: previewMode
            ? 'none'
            : `radial-gradient(circle, var(--surface-highest) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundColor: previewMode ? '#111' : 'var(--surface)',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            padding: `${CANVAS_PADDING}px`,
          }}
          className="inline-block"
        >
          {previewMode ? (
            /* Live iframe preview */
            <div
              style={{
                width: resolution?.width ?? 1920,
                height: resolution?.height ?? 1080,
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0,0,0,.5)',
                position: 'relative',
              }}
            >
              <iframe
                key={slug}
                src={`/display.html?slug=${slug}`}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Preview"
                allow="autoplay; fullscreen; encrypted-media"
              />
              {/* Refresh overlay button */}
              <button
                onClick={(e) => {
                  const iframe = e.currentTarget.parentElement.querySelector('iframe')
                  if (iframe) iframe.src = iframe.src
                }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  backgroundColor: 'rgba(0,0,0,.5)', color: '#fff',
                  border: 'none', borderRadius: 4, padding: '2px 8px',
                  fontSize: 10, cursor: 'pointer',
                }}
              >
                ↺ Refresh
              </button>
            </div>
          ) : (
            <ScreenFrame />
          )}
        </div>
      </div>
    </div>
  )
}

export default Canvas
