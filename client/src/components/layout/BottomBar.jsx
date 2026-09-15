import { useEditorStore } from '@/stores/editorStore'
import { SCREEN_RESOLUTIONS } from '@/lib/constants'

function BottomBar() {
  const slug = useEditorStore(s => s.screenConfig.slug)
  const resolution = useEditorStore(s => SCREEN_RESOLUTIONS[s.screenConfig.resolution])
  const widgetCount = useEditorStore(s => s.widgetOrder.length)
  const snapEnabled = useEditorStore(s => s.snapEnabled)

  return (
    /* Stitch: surface-lowest elevated — ghost shadow top boundary */
    <footer
      className="h-6 px-4 flex items-center justify-between font-mono select-none"
      style={{
        backgroundColor: 'var(--surface-lowest)',
        boxShadow: '0 -1px 0 rgba(173,179,180,0.2)',
        fontSize: '10px',
        color: 'var(--ink-subtle)',
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--ink-muted)' }}>/screen/{slug}</span>
        {resolution && <span>{resolution.width} × {resolution.height}</span>}
      </div>

      <div className="flex items-center gap-3">
        {snapEnabled && <span style={{ color: 'var(--steel)' }}>snap: on</span>}
        <span>{widgetCount} widget{widgetCount !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#059669' }} />
          <span style={{ color: '#059669', opacity: 0.7 }}>ready</span>
        </div>
      </div>
    </footer>
  )
}

export default BottomBar
