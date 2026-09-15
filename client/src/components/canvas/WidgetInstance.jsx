import { useState, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { MIN_WIDGET_WIDTH, MIN_WIDGET_HEIGHT, GRID_SIZE, RESIZE_HANDLE_POSITIONS, HANDLE_STYLE } from '@/lib/constants'
import { getWidgetInfo } from '@/lib/widgetCatalog'
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
import React from 'react'

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

function WidgetInstance({ widgetId, zIndex = 1 }) {
  const widget = useEditorStore(s => s.widgets[widgetId])
  const isSelected = useEditorStore(s => s.selectedId === widgetId)
  const zoom = useEditorStore(s => s.zoom)
  const snapEnabled = useEditorStore(s => s.snapEnabled)
  const [isDragging, setIsDragging] = useState(false)

  if (!widget) return null

  const Renderer = WIDGET_RENDERERS[widget.type]
  const widgetInfo = getWidgetInfo(widget.type)
  const Icon = widgetInfo?.icon

  // Handle widget drag — divides by zoom for correct canvas coordinates
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startPos = { x: widget.x, y: widget.y }
    const currentZoom = useEditorStore.getState().zoom

    setIsDragging(true)
    useEditorStore.getState().selectWidget(widgetId)

    function onMouseMove(e) {
      const dx = (e.clientX - startX) / currentZoom
      const dy = (e.clientY - startY) / currentZoom

      let newX = startPos.x + dx
      let newY = startPos.y + dy

      if (useEditorStore.getState().snapEnabled) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
      }

      useEditorStore.getState().moveWidget(widgetId, newX, newY)
    }

    function onMouseUp() {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const opacity = widget.config?.opacity !== undefined ? widget.config.opacity : 1
  const ws = widget.config?._style || {}

  // Build inline styles from _style overrides
  const wrapperStyleOverride = {
    ...(ws.boxShadow   ? { boxShadow: ws.boxShadow } : {}),
    ...(ws.borderEnabled ? { border: `${ws.borderWidth || 1}px solid ${ws.borderColor || '#4b5563'}` } : {}),
    // CSS custom properties — consumed by widgets via var(--w-*)
    ...(ws.fontFamily    ? { '--w-font': `'${ws.fontFamily}', system-ui, sans-serif` } : {}),
    ...(ws.textColor     ? { '--w-color': ws.textColor } : {}),
    ...(ws.fontSize      ? { '--w-size': `${ws.fontSize}px` } : {}),
    ...(ws.lineHeight    ? { '--w-lh': String(ws.lineHeight) } : {}),
    ...(ws.letterSpacing ? { '--w-ls': `${ws.letterSpacing}px` } : {}),
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${widget.x}px`,
        top: `${widget.y}px`,
        width: `${widget.w}px`,
        height: `${widget.h}px`,
        zIndex: isSelected ? 900 + zIndex : zIndex,
        opacity,
        ...wrapperStyleOverride,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        useEditorStore.getState().selectWidget(widgetId)
      }}
      className={`group/widget rounded-xl transition-shadow duration-150 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Selection ring */}
      {isSelected && (
        <div className="absolute -inset-px ring-2 ring-indigo-500 rounded-xl pointer-events-none z-10" />
      )}

      {/* Widget type label — visible on hover */}
      {Icon && (
        <div className="absolute -top-6 left-1 flex items-center gap-1 opacity-0 group-hover/widget:opacity-100 transition-opacity pointer-events-none z-20">
          <Icon size={12} className="text-indigo-400" />
          <span className="text-[10px] font-medium text-indigo-400">{widgetInfo.label}</span>
        </div>
      )}

      {/* Widget renderer */}
      <div
        className="w-full h-full overflow-hidden select-none pointer-events-none"
        style={{
          borderRadius: ws.borderRadius !== undefined ? `${ws.borderRadius}px` : undefined,
          ...(ws.backgroundColor ? { background: ws.backgroundColor } : {}),
        }}
      >
        {Renderer && <Renderer config={widget.config} size={{ w: widget.w, h: widget.h }} />}
      </div>

      {/* Resize handles */}
      {isSelected && (
        <>
          {RESIZE_HANDLE_POSITIONS.map(pos => (
            <ResizeHandle
              key={pos}
              position={pos}
              widgetId={widgetId}
            />
          ))}
        </>
      )}
    </div>
  )
}

function ResizeHandle({ position, widgetId }) {
  const handleStyle = HANDLE_STYLE[position]

  const handleMouseDown = (e) => {
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const store = useEditorStore.getState()
    const widget = store.widgets[widgetId]
    const zoom = store.zoom
    const startGeom = { x: widget.x, y: widget.y, w: widget.w, h: widget.h }

    function onMouseMove(e) {
      const dx = (e.clientX - startX) / zoom
      const dy = (e.clientY - startY) / zoom

      let newW = startGeom.w
      let newH = startGeom.h
      let newX = startGeom.x
      let newY = startGeom.y

      if (position.includes('e')) newW = Math.max(MIN_WIDGET_WIDTH, startGeom.w + dx)
      if (position.includes('s')) newH = Math.max(MIN_WIDGET_HEIGHT, startGeom.h + dy)
      if (position.includes('w')) {
        newW = Math.max(MIN_WIDGET_WIDTH, startGeom.w - dx)
        newX = startGeom.x + (startGeom.w - newW)
      }
      if (position.includes('n')) {
        newH = Math.max(MIN_WIDGET_HEIGHT, startGeom.h - dy)
        newY = startGeom.y + (startGeom.h - newH)
      }

      const s = useEditorStore.getState()
      s.resizeWidget(widgetId, newW, newH)
      s.moveWidget(widgetId, newX, newY)
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={handleStyle}
      className="absolute w-2.5 h-2.5 bg-white border-2 border-indigo-500 rounded-full pointer-events-auto hover:scale-150 transition-transform z-20"
    />
  )
}

export default React.memo(WidgetInstance)
