import { useDraggable } from '@dnd-kit/core'
import { WIDGET_CATALOG } from '@/lib/widgetCatalog'
import { Lightbulb, GripVertical } from 'lucide-react'

const CATEGORY_MAP = {
  'Médias': ['youtube', 'video', 'slides', 'slideshow', 'image', 'playlist'],
  'Données': ['rss', 'kpi', 'ticketing', 'stocks', 'weather', 'calendar', 'chart'],
  'Interface': ['clock', 'ticker', 'breaking-news', 'logo', 'qrcode', 'text', 'countdown', 'iframe'],
}

function DraggableWidgetItem({ widget }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `catalog-${widget.type}`,
    data: { type: widget.type, source: 'catalog' }
  })

  const Icon = widget.icon

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group flex items-center gap-2.5 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-all duration-100 ${
        isDragging ? 'opacity-40 scale-95' : ''
      }`}
      style={isDragging ? {} : undefined}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e4e9ea' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '' }}
    >
      {/* Steel blue icon container */}
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ backgroundColor: 'var(--steel-light)', color: 'var(--steel-dim)' }}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium leading-tight" style={{ color: 'var(--ink)' }}>{widget.label}</div>
        <div className="text-[10px] leading-tight" style={{ color: 'var(--ink-subtle)' }}>{widget.defaultSize.w}×{widget.defaultSize.h}</div>
      </div>
      <GripVertical size={13} style={{ color: 'var(--ink-ghost)' }} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  )
}

function WidgetSidebar() {
  return (
    /* Stitch: surface-low (#f2f4f4) — recessed sidebar, no border */
    <aside
      className="w-52 overflow-y-auto flex flex-col"
      style={{ backgroundColor: 'var(--surface-low)' }}
    >
      <div className="p-2.5 flex-1">
        {Object.entries(CATEGORY_MAP).map(([category, types]) => (
          <div key={category} className="mb-4">
            {/* Blueprint label */}
            <h3 className="section-label px-2 mb-1.5">{category}</h3>
            <div className="space-y-0.5">
              {types.map(type => {
                const widget = WIDGET_CATALOG.find(w => w.type === type)
                return widget ? <DraggableWidgetItem key={type} widget={widget} /> : null
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tip — surface-high separates from list without a border */}
      <div className="p-2.5" style={{ backgroundColor: 'var(--surface-dim)' }}>
        <div className="flex items-start gap-2 px-1">
          <Lightbulb size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--steel)' }} />
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Glissez un widget sur le canvas. <span className="font-semibold">S</span> snap, <span className="font-semibold">G</span> grille.
          </p>
        </div>
      </div>
    </aside>
  )
}

export default WidgetSidebar
