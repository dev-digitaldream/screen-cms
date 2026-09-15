import { useEditorStore } from '@/stores/editorStore'
import { getWidgetInfo } from '@/lib/widgetCatalog'
import { PLAYLIST_ITEM_TYPES } from '@/components/widgets/PlaylistWidget'
import { ItemRenderer } from '@/components/widgets/shared/PlaylistRenderers'
import { Trash2, Copy, ArrowUp, ArrowDown, Plus, ChevronDown, ChevronRight, GripVertical, Database } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { Slider } from '@/components/ui/Slider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { MediaPickerField, MediaPickerMultiField } from '@/components/ui/MediaLibrary'
import { useState, useEffect } from 'react'

// ── Main component ────────────────────────────────────────────────────────────

function WidgetConfig({ widgetId }) {
  const widget = useEditorStore(s => s.widgets[widgetId])
  const info = getWidgetInfo(widget?.type)

  if (!widget || !info) return null

  const store = useEditorStore.getState

  const handleConfigChange = (key, value) => {
    store().updateWidgetConfig(widgetId, { [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Position & size */}
      <Section title="Position & Taille">
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <input type="number" value={Math.round(widget.x)}
              onChange={(e) => store().moveWidget(widgetId, parseFloat(e.target.value) || 0, widget.y)}
              className="input-base w-full" />
          </Field>
          <Field label="Y">
            <input type="number" value={Math.round(widget.y)}
              onChange={(e) => store().moveWidget(widgetId, widget.x, parseFloat(e.target.value) || 0)}
              className="input-base w-full" />
          </Field>
          <Field label="W">
            <input type="number" value={Math.round(widget.w)}
              onChange={(e) => store().resizeWidget(widgetId, parseFloat(e.target.value) || 100, widget.h)}
              className="input-base w-full" />
          </Field>
          <Field label="H">
            <input type="number" value={Math.round(widget.h)}
              onChange={(e) => store().resizeWidget(widgetId, widget.w, parseFloat(e.target.value) || 60)}
              className="input-base w-full" />
          </Field>
        </div>
      </Section>

      {/* Widget-specific config OR playlist editor */}
      {widget.type === 'playlist' ? (
        <PlaylistEditor widgetId={widgetId} config={widget.config} />
      ) : (
        <Section title="Configuration">
          {info.configSchema.map(field => {
            if (field.visibleIf && !field.visibleIf(widget.config)) return null
            return (
              <ConfigField
                key={field.key}
                field={field}
                value={widget.config[field.key]}
                onChange={(val) => handleConfigChange(field.key, val)}
              />
            )
          })}
        </Section>
      )}

      {/* Data source binding for KPI / ticker widgets */}
      {['kpi', 'ticker'].includes(widget.type) && (
        <DataSourceBinding widgetId={widgetId} config={widget.config} />
      )}

      {/* Ticketing: datasource selector inline (no separate binding panel) */}
      {widget.type === 'ticketing' && (
        <Section title="Source de données">
          <TicketingDsBinding widgetId={widgetId} config={widget.config} />
        </Section>
      )}

      {/* Universal style panel */}
      <StylePanel widgetId={widgetId} config={widget.config} />

      {/* Appearance — opacity + entrance animation */}
      <Section title="Apparence">
        <Slider
          label={`Opacité — ${Math.round((widget.config.opacity ?? 1) * 100)}%`}
          value={widget.config.opacity ?? 1}
          onChange={(v) => handleConfigChange('opacity', v)}
          min={0} max={1} step={0.05}
        />
        <Field label="Animation d'entrée">
          <Dropdown
            value={widget.config.animation || 'none'}
            onChange={(v) => handleConfigChange('animation', v)}
            options={[
              { value: 'none',       label: 'Aucune' },
              { value: 'fade',       label: 'Fondu' },
              { value: 'slideLeft',  label: 'Glisser depuis gauche' },
              { value: 'slideRight', label: 'Glisser depuis droite' },
              { value: 'slideUp',    label: 'Glisser depuis bas' },
              { value: 'slideDown',  label: 'Glisser depuis haut' },
              { value: 'zoom',       label: 'Zoom' },
            ]}
          />
        </Field>
        {widget.config.animation && widget.config.animation !== 'none' && (
          <Slider
            label={`Délai — ${widget.config.animationDelay || 0}s`}
            value={widget.config.animationDelay || 0}
            onChange={(v) => handleConfigChange('animationDelay', v)}
            min={0} max={5} step={0.25}
          />
        )}
      </Section>

      {/* Actions */}
      <Section title="Actions">
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => store().reorderWidget(widgetId, 'up')}
            className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-1.5">
            <ArrowUp size={12} /> Devant
          </button>
          <button onClick={() => store().reorderWidget(widgetId, 'down')}
            className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-1.5">
            <ArrowDown size={12} /> Derrière
          </button>
        </div>
        <button onClick={() => store().duplicateWidget(widgetId)}
          className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5 py-1.5">
          <Copy size={12} /> Dupliquer
        </button>
        <button onClick={() => store().removeWidget(widgetId)}
          className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <Trash2 size={12} /> Supprimer
        </button>
      </Section>
    </div>
  )
}

// ── Data source binding ───────────────────────────────────────────────────────

function DataSourceBinding({ widgetId, config }) {
  const [sources, setSources] = useState([])
  const [open, setOpen] = useState(false)
  const update = (k, v) => useEditorStore.getState().updateWidgetConfig(widgetId, { [k]: v })

  useEffect(() => {
    if (!open) return
    fetch('/api/v1/datasources')
      .then(r => r.json())
      .then(setSources)
      .catch(() => {})
  }, [open])

  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
        style={{ color: 'var(--ink)', backgroundColor: 'var(--surface-lowest)' }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2">
          <Database size={14} style={{ color: 'var(--steel)' }} /> Source de données live
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="p-3 space-y-3">
          <Field label="Source">
            <select
              className="input-base w-full"
              value={config.datasourceId || ''}
              onChange={e => update('datasourceId', e.target.value || null)}
            >
              <option value="">— Aucune (valeur manuelle) —</option>
              {sources.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          {config.datasourceId && (
            <>
              <Field label="Champ (ex: data.total)">
                <input
                  className="input-base w-full font-mono text-xs"
                  value={config.datasourceField || ''}
                  onChange={e => update('datasourceField', e.target.value)}
                  placeholder="results.0.value"
                />
              </Field>
              <Field label="Refresh UI (secondes)">
                <input
                  type="number" min={10}
                  className="input-base w-full"
                  value={config.refresh_s || 30}
                  onChange={e => update('refresh_s', parseInt(e.target.value) || 30)}
                />
              </Field>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Le serveur recharge la source toutes les {sources.find(s => s.id === config.datasourceId)?.refresh_s || '?'}s.
                Le widget rafraîchit l'affichage toutes les {config.refresh_s || 30}s.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Ticketing datasource selector ────────────────────────────────────────────

function TicketingDsBinding({ widgetId, config }) {
  const [sources, setSources] = useState([])
  const update = (k, v) => useEditorStore.getState().updateWidgetConfig(widgetId, { [k]: v })

  useEffect(() => {
    fetch('/api/v1/datasources').then(r => r.json()).then(setSources).catch(() => {})
  }, [])

  return (
    <Field label="Source API">
      <select className="input-base w-full" value={config.datasourceId || ''}
        onChange={e => update('datasourceId', e.target.value || null)}>
        <option value="">— Aucune —</option>
        {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </Field>
  )
}

// ── Style panel (universal) ───────────────────────────────────────────────────

function StylePanel({ widgetId, config }) {
  const ws = config._style || {}
  const [open, setOpen] = useState(false)

  const update = (key, value) => {
    useEditorStore.getState().updateWidgetConfig(widgetId, {
      _style: { ...ws, [key]: value },
    })
  }

  const FONT_OPTIONS = [
    { value: '',              label: 'Hérité de l\'écran' },
    { value: 'Inter',         label: 'Inter' },
    { value: 'Poppins',       label: 'Poppins' },
    { value: 'Roboto',        label: 'Roboto' },
    { value: 'Montserrat',    label: 'Montserrat' },
    { value: 'Raleway',       label: 'Raleway' },
    { value: 'Oswald',        label: 'Oswald' },
    { value: 'Nunito',        label: 'Nunito' },
    { value: 'Barlow',        label: 'Barlow' },
    { value: 'Space Grotesk', label: 'Space Grotesk' },
    { value: 'DM Sans',       label: 'DM Sans' },
  ]

  const SHADOW_OPTIONS = [
    { value: '',      label: 'Aucune' },
    { value: '0 2px 8px rgba(0,0,0,.25)',                                         label: 'Subtile' },
    { value: '0 8px 24px rgba(0,0,0,.35)',                                         label: 'Douce' },
    { value: '0 16px 48px rgba(0,0,0,.55)',                                        label: 'Forte' },
    { value: '0 0 0 2px rgba(99,102,241,.45), 0 8px 24px rgba(99,102,241,.25)',   label: 'Lueur indigo' },
    { value: '0 0 0 2px rgba(16,185,129,.45), 0 8px 24px rgba(16,185,129,.25)',   label: 'Lueur verte' },
    { value: '0 0 0 2px rgba(245,158,11,.45), 0 8px 24px rgba(245,158,11,.25)',   label: 'Lueur dorée' },
    { value: '0 0 0 2px rgba(239,68,68,.45), 0 8px 24px rgba(239,68,68,.25)',     label: 'Lueur rouge' },
  ]

  return (
    <div className="pb-3 border-b border-gray-100 dark:border-zinc-800">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
          Style & Typographie
        </h4>
        {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* Background */}
          <ColorPicker
            label="Fond du widget"
            value={ws.backgroundColor || ''}
            onChange={v => update('backgroundColor', v)}
          />

          {/* Border radius */}
          <Slider
            label={`Arrondi — ${ws.borderRadius ?? 12}px`}
            value={ws.borderRadius ?? 12}
            onChange={v => update('borderRadius', v)}
            min={0} max={40} step={1}
          />

          {/* Shadow */}
          <Field label="Ombre / Lueur">
            <Dropdown value={ws.boxShadow || ''} onChange={v => update('boxShadow', v)} options={SHADOW_OPTIONS} />
          </Field>

          {/* Border */}
          <Toggle
            label="Bordure"
            value={!!ws.borderEnabled}
            onChange={v => update('borderEnabled', v)}
          />
          {ws.borderEnabled && (
            <div className="pl-3 space-y-2 border-l-2 border-indigo-500/30">
              <ColorPicker label="Couleur bordure" value={ws.borderColor || '#4b5563'} onChange={v => update('borderColor', v)} />
              <Slider label={`Épaisseur — ${ws.borderWidth ?? 1}px`}
                value={ws.borderWidth ?? 1} onChange={v => update('borderWidth', v)} min={1} max={8} step={0.5} />
            </div>
          )}

          {/* Typography */}
          <div className="pt-1" style={{ borderTop: '1px dashed var(--surface-high)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">Typographie</p>
            <Field label="Police">
              <Dropdown value={ws.fontFamily || ''} onChange={v => update('fontFamily', v)} options={FONT_OPTIONS} />
            </Field>
            <ColorPicker label="Couleur texte principale" value={ws.textColor || ''} onChange={v => update('textColor', v)} />
            <Slider
              label={`Taille de base — ${ws.fontSize || 0}px ${ws.fontSize ? '' : '(auto)'}`}
              value={ws.fontSize || 0} onChange={v => update('fontSize', v)}
              min={0} max={120} step={1}
            />
            <Slider
              label={`Interligne — ${ws.lineHeight || 0} ${ws.lineHeight ? '' : '(auto)'}`}
              value={ws.lineHeight || 0} onChange={v => update('lineHeight', v)}
              min={0} max={3} step={0.05}
            />
            <Slider
              label={`Espacement lettres — ${ws.letterSpacing || 0}px`}
              value={ws.letterSpacing || 0} onChange={v => update('letterSpacing', v)}
              min={-2} max={20} step={0.5}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Playlist editor ───────────────────────────────────────────────────────────

function PlaylistEditor({ widgetId, config }) {
  const items = config.items || []
  const [expandedId, setExpandedId] = useState(null)

  const setConfig = (changes) => {
    useEditorStore.getState().updateWidgetConfig(widgetId, changes)
  }

  const setItems = (next) => {
    useEditorStore.getState().updateWidgetConfig(widgetId, { items: next })
  }

  const addItem = () => {
    const id = Math.random().toString(36).substr(2, 9)
    const newItem = { id, type: 'image', label: '', duration: 15, imageUrl: '' }
    const next = [...items, newItem]
    setItems(next)
    setExpandedId(id)
  }

  const removeItem = (id) => {
    setItems(items.filter(it => it.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const updateItem = (id, changes) => {
    setItems(items.map(it => it.id === id ? { ...it, ...changes } : it))
  }

  const moveItem = (id, dir) => {
    const idx = items.findIndex(it => it.id === id)
    if (idx < 0) return
    const next = [...items]
    if (dir === 'up' && idx > 0) {
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    } else if (dir === 'down' && idx < next.length - 1) {
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    }
    setItems(next)
  }

  const totalDuration = items.reduce((sum, it) => sum + (it.duration || 30), 0)

  return (
    <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
          Playlist — {items.length} item{items.length !== 1 ? 's' : ''}
          {items.length > 0 && <span className="ml-1 font-normal normal-case">· {formatDuration(totalDuration)}</span>}
        </h4>
      </div>

      {/* Playlist-level transition */}
      <Field label="Transition entre items">
        <Dropdown
          value={config.transition || 'fade'}
          onChange={v => setConfig({ transition: v })}
          options={[
            { value: 'fade',        label: '⬛ Fondu enchaîné' },
            { value: 'slide-left',  label: '◀ Glissement gauche' },
            { value: 'slide-right', label: '▶ Glissement droite' },
            { value: 'zoom',        label: '🔍 Zoom' },
            { value: 'none',        label: '⚡ Instantané' },
          ]}
        />
      </Field>

      {/* Item list */}
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <PlaylistItemRow
            key={item.id}
            item={item}
            index={idx}
            total={items.length}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onUpdate={(changes) => updateItem(item.id, changes)}
            onRemove={() => removeItem(item.id)}
            onMoveUp={() => moveItem(item.id, 'up')}
            onMoveDown={() => moveItem(item.id, 'down')}
          />
        ))}
      </div>

      <button
        onClick={addItem}
        className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5 py-1.5"
      >
        <Plus size={12} /> Ajouter un item
      </button>
    </div>
  )
}

function PlaylistItemRow({ item, index, total, expanded, onToggle, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  const typeInfo = PLAYLIST_ITEM_TYPES.find(t => t.value === item.type)
  const isInfinite = (item.type === 'youtube' || item.type === 'video') && item.loop

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--surface-high)', backgroundColor: 'var(--surface)' }}
    >
      {/* Row header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer" onClick={onToggle}>
        <span className="text-[13px] flex-shrink-0">{typeInfo?.emoji || '▪'}</span>
        <span className="text-[11px] font-medium flex-1 truncate" style={{ color: 'var(--ink)' }}>
          {item.label || typeInfo?.label || item.type}
        </span>
        <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--ink-subtle)' }}>
          {isInfinite ? '∞' : `${item.duration || 30}s`}
        </span>
        <div className="flex gap-0.5">
          <div className="cursor-grab active:cursor-grabbing p-0.5 opacity-50 hover:opacity-100" title="Glisser pour réorganiser">
            <GripVertical size={10} style={{ color: 'var(--ink-subtle)' }} />
          </div>
          <button onClick={(e) => { e.stopPropagation(); onMoveUp() }}
            className="btn-ghost p-0.5" disabled={index === 0} title="Monter (↑)">
            <ArrowUp size={10} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown() }}
            className="btn-ghost p-0.5" disabled={index === total - 1} title="Descendre (↓)">
            <ArrowDown size={10} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="btn-ghost p-0.5 text-red-400 hover:text-red-500" title="Supprimer">
            <Trash2 size={10} />
          </button>
        </div>
        {expanded ? <ChevronDown size={12} style={{ color: 'var(--ink-subtle)' }} /> : <ChevronRight size={12} style={{ color: 'var(--ink-subtle)' }} />}
      </div>

      {/* Expanded item fields */}
      {expanded && (
        <div className="px-2 pb-2 space-y-2" style={{ borderTop: '1px solid var(--surface-high)' }}>
          {/* Type selector */}
          <Field label="Type de contenu">
            <Dropdown
              value={item.type}
              onChange={v => onUpdate({ type: v })}
              options={PLAYLIST_ITEM_TYPES.map(t => ({ value: t.value, label: `${t.emoji} ${t.label}` }))}
            />
          </Field>

          {/* Label */}
          <Field label="Nom / label">
            <input type="text" value={item.label || ''} onChange={e => onUpdate({ label: e.target.value })}
              placeholder="Optionnel" className="input-base w-full" />
          </Field>

          {/* Duration (not shown for infinite loops) */}
          {!isInfinite && (
            <Field label={`Durée — ${item.duration || 30}s`}>
              <input type="number" value={item.duration || 30} min={3} max={3600}
                onChange={e => onUpdate({ duration: parseInt(e.target.value) || 30 })}
                className="input-base w-full" />
            </Field>
          )}

          {/* Type-specific fields */}
          <PlaylistItemFields item={item} onUpdate={onUpdate} />

          {/* Immediate preview */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
            <div className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 mb-2">Aperçu immédiat</div>
            <div className="rounded-lg overflow-hidden bg-black" style={{ height: '120px' }}>
              <PlaylistItemPreview item={item} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlaylistItemFields({ item, onUpdate }) {
  switch (item.type) {
    case 'youtube':
      return (
        <>
          <Field label="URL YouTube (vidéo ou playlist)">
            <input type="text" value={item.url || ''} onChange={e => onUpdate({ url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..." className="input-base w-full" />
          </Field>
          <Toggle label="Muet" value={item.muted !== false} onChange={v => onUpdate({ muted: v })} />
          <Toggle label="Boucle infinie (durée ignorée)" value={!!item.loop} onChange={v => onUpdate({ loop: v })} />
          <Toggle label="Sous-titres" value={!!item.captions} onChange={v => onUpdate({ captions: v })} />
          {item.captions && (
            <Field label="Langue sous-titres">
              <Dropdown
                value={item.captionsLang || 'fr'}
                onChange={v => onUpdate({ captionsLang: v })}
                options={[
                  { value: 'fr', label: 'Français' },
                  { value: 'nl', label: 'Nederlands' },
                  { value: 'en', label: 'English' },
                  { value: 'de', label: 'Deutsch' },
                  { value: 'es', label: 'Español' },
                ]}
              />
            </Field>
          )}
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    case 'image':
      return (
        <>
          <MediaPickerField label="Image" value={item.imageUrl || ''} onChange={v => onUpdate({ imageUrl: v })} accept="image" />
          <Field label="Ajustement">
            <Dropdown value={item.fit || 'cover'} onChange={v => onUpdate({ fit: v })}
              options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Remplir' }]} />
          </Field>
          {/* Text overlay */}
          <Field label="Texte superposé (optionnel)">
            <input type="text" value={item.overlayText || ''} onChange={e => onUpdate({ overlayText: e.target.value })}
              placeholder="ex: Bienvenue !" className="input-base w-full" />
          </Field>
          {item.overlayText && (
            <>
              <Field label="Sous-texte overlay">
                <input type="text" value={item.overlaySubtext || ''} onChange={e => onUpdate({ overlaySubtext: e.target.value })}
                  placeholder="ex: Visitez notre site" className="input-base w-full" />
              </Field>
              <Slider label={`Taille texte — ${item.overlayFontSize || 48}px`}
                value={item.overlayFontSize || 48} onChange={v => onUpdate({ overlayFontSize: v })} min={16} max={200} step={2} />
              <ColorPicker label="Couleur texte" value={item.overlayColor || '#ffffff'} onChange={v => onUpdate({ overlayColor: v })} />
              <ColorPicker label="Fond overlay" value={item.overlayBg || 'rgba(0,0,0,0.35)'} onChange={v => onUpdate({ overlayBg: v })} />
              <Field label="Position verticale">
                <Dropdown value={item.overlayVAlign || 'center'} onChange={v => onUpdate({ overlayVAlign: v })}
                  options={[{ value: 'top', label: 'Haut' }, { value: 'center', label: 'Centre' }, { value: 'bottom', label: 'Bas' }]} />
              </Field>
              <Field label="Alignement horizontal">
                <Dropdown value={item.overlayAlign || 'center'} onChange={v => onUpdate({ overlayAlign: v })}
                  options={[{ value: 'flex-start', label: 'Gauche' }, { value: 'center', label: 'Centre' }, { value: 'flex-end', label: 'Droite' }]} />
              </Field>
            </>
          )}
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    case 'slideshow':
      return (
        <>
          <MediaPickerMultiField label="Images du diaporama" value={item.images || []} onChange={v => onUpdate({ images: v })} accept="image" />
          <Slider label={`Durée par image — ${item.imageInterval || 5}s`}
            value={item.imageInterval || 5} onChange={v => onUpdate({ imageInterval: v })} min={1} max={60} step={1} />
          <Field label="Ajustement">
            <Dropdown value={item.fit || 'cover'} onChange={v => onUpdate({ fit: v })}
              options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Remplir' }]} />
          </Field>
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    case 'video':
      return (
        <>
          <MediaPickerField label="Vidéo" value={item.videoUrl || ''} onChange={v => onUpdate({ videoUrl: v })} accept="video" />
          <Toggle label="Muet" value={item.muted !== false} onChange={v => onUpdate({ muted: v })} />
          <Toggle label="Boucle infinie (durée ignorée)" value={!!item.loop} onChange={v => onUpdate({ loop: v })} />
          <Field label="Ajustement">
            <Dropdown value={item.fit || 'cover'} onChange={v => onUpdate({ fit: v })}
              options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Remplir' }]} />
          </Field>
          <Field label="Démarrer à (secondes)">
            <input type="number" value={item.startAt || 0} min={0}
              onChange={e => onUpdate({ startAt: parseFloat(e.target.value) || 0 })}
              className="input-base w-full" />
          </Field>
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    case 'text':
      return (
        <>
          <Field label="Accroche (optionnel)">
            <input type="text" value={item.eyebrow || ''} onChange={e => onUpdate({ eyebrow: e.target.value })}
              placeholder="ex: NOUVEAU" className="input-base w-full" />
          </Field>
          <Field label="Message principal">
            <textarea value={item.content || ''} onChange={e => onUpdate({ content: e.target.value })}
              rows={3} placeholder="Votre message ici" className="input-base w-full resize-none" />
          </Field>
          <Field label="Sous-titre (optionnel)">
            <input type="text" value={item.subtitle || ''} onChange={e => onUpdate({ subtitle: e.target.value })}
              placeholder="ex: Pour plus d'infos, contactez-nous" className="input-base w-full" />
          </Field>
          <ColorPicker label="Couleur texte" value={item.textColor || '#ffffff'} onChange={v => onUpdate({ textColor: v })} />
          <ColorPicker label="Fond" value={item.backgroundColor || '#0a0a0e'} onChange={v => onUpdate({ backgroundColor: v })} />
          <ColorPicker label="Couleur accroche" value={item.accentColor || '#6366f1'} onChange={v => onUpdate({ accentColor: v })} />
          <Field label="Police">
            <Dropdown value={item.fontFamily || ''} onChange={v => onUpdate({ fontFamily: v })}
              options={[
                { value: '', label: 'Système' },
                { value: 'Inter', label: 'Inter' }, { value: 'Poppins', label: 'Poppins' },
                { value: 'Roboto', label: 'Roboto' }, { value: 'Montserrat', label: 'Montserrat' },
                { value: 'Oswald', label: 'Oswald' }, { value: 'Space Grotesk', label: 'Space Grotesk' },
              ]} />
          </Field>
          <Slider label={`Taille — ${item.fontSize || 'auto'}px`}
            value={item.fontSize || 48} onChange={v => onUpdate({ fontSize: v })} min={16} max={200} step={2} />
          <Field label="Alignement">
            <Dropdown value={item.textAlign || 'center'} onChange={v => onUpdate({ textAlign: v })}
              options={[{ value: 'left', label: 'Gauche' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Droite' }]} />
          </Field>
          <Slider label={`Interligne — ${item.lineHeight || 1.2}`}
            value={item.lineHeight || 1.2} onChange={v => onUpdate({ lineHeight: v })} min={1} max={3} step={0.05} />
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    case 'slides':
      return (
        <>
          <Field label="URL Google Slides (partager → intégrer)">
            <input type="text" value={item.url || ''} onChange={e => onUpdate({ url: e.target.value })}
              placeholder="https://docs.google.com/presentation/d/..." className="input-base w-full" />
          </Field>
          <Toggle label="Avance automatique des diapositives" value={item.autoAdvance !== false} onChange={v => onUpdate({ autoAdvance: v })} />
          {item.autoAdvance !== false && (
            <Slider label={`Durée par diapositive — ${item.slideInterval || 5}s`}
              value={item.slideInterval || 5} onChange={v => onUpdate({ slideInterval: v })} min={2} max={120} step={1} />
          )}
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    case 'pdf':
      return (
        <>
          <Field label="URL du PDF">
            <input type="text" value={item.url || ''} onChange={e => onUpdate({ url: e.target.value })}
              placeholder="https://... ou /uploads/..." className="input-base w-full" />
          </Field>
          <Field label="Nombre de pages">
            <input type="number" value={item.pageCount || 1} min={1} max={200}
              onChange={e => onUpdate({ pageCount: parseInt(e.target.value) || 1 })}
              className="input-base w-full" />
          </Field>
          <Slider label={`Durée par page — ${item.pageInterval || 8}s`}
            value={item.pageInterval || 8} onChange={v => onUpdate({ pageInterval: v })} min={3} max={60} step={1} />
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    case 'iframe':
      return (
        <>
          <Field label="URL (Looker Studio, site web...)">
            <input type="text" value={item.url || ''} onChange={e => onUpdate({ url: e.target.value })}
              placeholder="https://lookerstudio.google.com/..." className="input-base w-full" />
          </Field>
          <Field label="Défilement automatique">
            <Dropdown value={item.scrollDir || 'none'} onChange={v => onUpdate({ scrollDir: v })}
              options={[
                { value: 'none',       label: 'Aucun' },
                { value: 'vertical',   label: 'Vertical (tableau long)' },
                { value: 'horizontal', label: 'Horizontal (tableau large)' },
              ]} />
          </Field>
          {item.scrollDir && item.scrollDir !== 'none' && (
            <>
              <Slider label={`Vitesse défilement — ${item.scrollSpeed || 50}px/s`}
                value={item.scrollSpeed || 50} onChange={v => onUpdate({ scrollSpeed: v })} min={5} max={300} step={5} />
              <Field label={`Hauteur contenu (px) — pour défilement vertical`}>
                <input type="number" value={item.contentHeight || 2400} min={400}
                  onChange={e => onUpdate({ contentHeight: parseInt(e.target.value) || 2400 })}
                  className="input-base w-full" />
              </Field>
            </>
          )}
          <Slider label={`Zoom page — ${item.zoom || 100}%`}
            value={item.zoom || 100} onChange={v => onUpdate({ zoom: v })} min={25} max={200} step={5} />
          <ColorPicker label="Fond" value={item.background || '#ffffff'} onChange={v => onUpdate({ background: v })} />
          <ScheduleFields item={item} onUpdate={onUpdate} />
        </>
      )

    default:
      return null
  }
}

function ScheduleFields({ item, onUpdate }) {
  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  return (
    <>
      <Toggle
        label="Programmation horaire (afficher seulement à certaines heures)"
        value={!!item.scheduleEnabled}
        onChange={v => onUpdate({ scheduleEnabled: v })}
      />
      {item.scheduleEnabled && (
        <>
          <Field label="Jours actifs">
            <div className="flex gap-1 flex-wrap">
              {DAYS.map((d, i) => {
                const active = (item.scheduleDays || [0,1,2,3,4,5,6]).includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const cur = item.scheduleDays || [0,1,2,3,4,5,6]
                      const next = active ? cur.filter(x => x !== i) : [...cur, i].sort()
                      onUpdate({ scheduleDays: next })
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      active
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'bg-transparent border-zinc-600 text-zinc-400'
                    }`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Début">
              <input type="time" value={item.scheduleStart || '08:00'}
                onChange={e => onUpdate({ scheduleStart: e.target.value })}
                className="input-base w-full" />
            </Field>
            <Field label="Fin">
              <input type="time" value={item.scheduleEnd || '18:00'}
                onChange={e => onUpdate({ scheduleEnd: e.target.value })}
                className="input-base w-full" />
            </Field>
          </div>
        </>
      )}
    </>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] text-gray-500 dark:text-zinc-400 block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
      <div className={`relative w-8 h-[18px] rounded-full transition-colors ${value ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
      </div>
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="sr-only" />
      <span className="text-[12px] text-gray-700 dark:text-zinc-300">{label}</span>
    </label>
  )
}

function ConfigField({ field, value, onChange }) {
  const displayValue = value ?? field.default ?? ''

  if (field.type === 'text') return (
    <Field label={field.label}>
      <input type="text" value={displayValue} onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder} className="input-base w-full" />
    </Field>
  )

  if (field.type === 'number') return (
    <Field label={field.label}>
      <input type="number" value={displayValue} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        min={field.min} max={field.max} className="input-base w-full" />
    </Field>
  )

  if (field.type === 'boolean') return (
    <Toggle label={field.label} value={!!displayValue} onChange={onChange} />
  )

  if (field.type === 'select') {
    const options = (field.options || []).map(opt => ({ value: opt, label: String(opt) }))
    return (
      <Field label={field.label}>
        <Dropdown value={displayValue} onChange={onChange} options={options} />
      </Field>
    )
  }

  if (field.type === 'slider') return (
    <Slider label={field.label}
      value={typeof displayValue === 'number' ? displayValue : field.min || 0}
      onChange={onChange} min={field.min} max={field.max} step={field.step} />
  )

  if (field.type === 'color') return (
    <ColorPicker label={field.label} value={displayValue || '#000000'} onChange={onChange} />
  )

  if (field.type === 'textarea') return (
    <Field label={field.label}>
      <textarea value={displayValue} onChange={e => onChange(e.target.value)}
        rows={3} className="input-base w-full resize-none" />
    </Field>
  )

  if (field.type === 'file') return (
    <MediaPickerField label={field.label} value={displayValue} onChange={onChange} accept={field.accept || 'image'} />
  )

  if (field.type === 'filelist') return (
    <MediaPickerMultiField label={field.label} value={Array.isArray(displayValue) ? displayValue : []} onChange={onChange} accept={field.accept || 'image'} />
  )

  return null
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}min`
}

// ── Playlist item preview ─────────────────────────────────────────────────────

function PlaylistItemPreview({ item }) {
  const size = { w: 320, h: 120 }
  
  // Use the shared renderers for preview
  try {
    return <ItemRenderer item={item} size={size} />
  } catch (err) {
    // Fallback for any errors
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
        Preview error
      </div>
    )
  }
}

export default WidgetConfig
