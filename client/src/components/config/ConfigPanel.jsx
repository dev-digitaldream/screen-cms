import { useEditorStore } from '@/stores/editorStore'
import { getWidgetInfo } from '@/lib/widgetCatalog'
import { PanelRightClose, PanelRightOpen, Settings2 } from 'lucide-react'
import WidgetConfig from './WidgetConfig'
import ScreenConfig from './ScreenConfig'

function ConfigPanel() {
  const selectedId = useEditorStore(s => s.selectedId)
  const selectedType = useEditorStore(s => s.selectedId ? s.widgets[s.selectedId]?.type : null)
  const configPanelOpen = useEditorStore(s => s.configPanelOpen)
  const setConfigPanelOpen = useEditorStore(s => s.setConfigPanelOpen)

  if (!configPanelOpen) return null

  const widgetInfo = selectedType ? getWidgetInfo(selectedType) : null
  const Icon = widgetInfo?.icon || Settings2

  return (
    /* Stitch: surface-low recessed inspector — no border, background shift */
    <aside
      className="w-68 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--surface-low)', width: '17rem' }}
    >
      {/* Header — surface-lowest elevated strip */}
      <div
        className="h-9 flex items-center justify-between px-3 flex-shrink-0"
        style={{ backgroundColor: 'var(--surface-lowest)', boxShadow: '0 1px 0 rgba(173,179,180,0.2)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={13} style={{ color: 'var(--steel)', flexShrink: 0 }} />
          <h3 className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {selectedId ? widgetInfo?.label || 'Widget' : 'Configuration écran'}
          </h3>
        </div>
        <button
          onClick={() => setConfigPanelOpen(false)}
          className="btn-ghost"
          aria-label="Fermer le panneau"
        >
          <PanelRightClose size={13} />
        </button>
      </div>

      {/* Content — inspector cards float on surface-low */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {selectedId ? (
            <WidgetConfig widgetId={selectedId} />
          ) : (
            <ScreenConfig />
          )}
        </div>
      </div>
    </aside>
  )
}

export default ConfigPanel
