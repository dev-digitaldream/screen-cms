import { useDroppable } from '@dnd-kit/core'
import { useEditorStore } from '@/stores/editorStore'
import { SCREEN_RESOLUTIONS, GRID_SIZE } from '@/lib/constants'
import WidgetInstance from './WidgetInstance'
import React from 'react'

function ScreenFrame() {
  const resolution = useEditorStore(s => SCREEN_RESOLUTIONS[s.screenConfig.resolution])
  const backgroundColor = useEditorStore(s => s.screenConfig.backgroundColor)
  const gridVisible = useEditorStore(s => s.gridVisible)
  const widgetOrder = useEditorStore(s => s.widgetOrder)

  const { setNodeRef, isOver } = useDroppable({ id: 'screen-canvas' })

  if (!resolution) return null

  return (
    <div
      id="screen-frame"
      ref={setNodeRef}
      style={{
        width: resolution.width,
        height: resolution.height,
        backgroundColor,
      }}
      className={`relative rounded-lg shadow-2xl transition-all ${
        isOver
          ? 'ring-2 ring-indigo-500/40 ring-offset-4 ring-offset-zinc-950'
          : 'border border-zinc-700/50'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          useEditorStore.getState().deselect()
        }
      }}
    >
      {/* Grid */}
      {gridVisible && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px),
              radial-gradient(circle, rgba(99,102,241,0.45) 1.5px, transparent 1.5px)
            `,
            backgroundSize: `${GRID_SIZE * 4}px ${GRID_SIZE * 4}px, ${GRID_SIZE * 4}px ${GRID_SIZE * 4}px, ${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        />
      )}

      {/* Widgets */}
      {widgetOrder.map((id, index) => (
        <WidgetInstance key={id} widgetId={id} zIndex={index + 1} />
      ))}

      {/* Empty state */}
      {widgetOrder.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-500">Glissez des widgets ici</p>
            <p className="text-xs text-zinc-600 mt-1">Depuis la barre latérale gauche</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ScreenFrame)
