import { useEditorStore } from '@/stores/editorStore'
import { MediaLibrary } from '@/components/ui/MediaLibrary'
import {
  Play, Plus, Trash2, ListVideo, Film,
  X, Youtube, Presentation, Image, AlertTriangle, List,
  ChevronUp, ChevronDown, Clock, Repeat, Info
} from 'lucide-react'
import { useState } from 'react'

// ── Slot type definitions ──────────────────────────────────────────────────

const SLOT_TYPES = [
  { type: 'youtube',   label: 'YouTube',        emoji: '📺', color: '#ef4444', defaultDuration: 90 },
  { type: 'slides',    label: 'Google Slides',  emoji: '📊', color: '#f59e0b', defaultDuration: 60 },
  { type: 'image',     label: 'Image',          emoji: '🖼️',  color: '#10b981', defaultDuration: 15 },
  { type: 'video',     label: 'Vidéo locale',   emoji: '🎬', color: '#8b5cf6', defaultDuration: 60 },
  { type: 'playlist',  label: 'Diaporama',      emoji: '🗂️',  color: '#14b8a6', defaultDuration: 40 },
  { type: 'emergency', label: 'Urgence',        emoji: '🚨', color: '#dc2626', defaultDuration: 30 },
]

function getSlotMeta(type) {
  return SLOT_TYPES.find(s => s.type === type) || SLOT_TYPES[0]
}

function formatDuration(sec) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60), s = sec % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

// ── Mini toggle ────────────────────────────────────────────────────────────

function MiniToggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="relative rounded-full transition-colors flex-shrink-0"
        style={{ width: 34, height: 18, backgroundColor: checked ? '#6366f1' : '#374151' }}
      >
        <div
          className="absolute top-[2px] rounded-full bg-white shadow transition-transform"
          style={{ width: 14, height: 14, transform: `translateX(${checked ? 18 : 2}px)` }}
        />
      </div>
      {label && <span className="text-[13px]" style={{ color: '#9ca3af' }}>{label}</span>}
    </label>
  )
}

// Stable empty array — prevents Zustand infinite loop when timelineItems is undefined
const EMPTY_ITEMS = []

// ── Main TimelineEditor ────────────────────────────────────────────────────

function TimelineEditor() {
  const timelineEnabled  = useEditorStore(s => s.screenConfig.timelineEnabled || false)
  const timelineItems    = useEditorStore(s => s.screenConfig.timelineItems || EMPTY_ITEMS)
  const toggleTimeline   = useEditorStore(s => s.toggleTimeline)
  const addTimelineItem  = useEditorStore(s => s.addTimelineItem)
  const removeTimelineItem = useEditorStore(s => s.removeTimelineItem)
  const updateTimelineItem = useEditorStore(s => s.updateTimelineItem)
  const reorderTimelineItems = useEditorStore(s => s.reorderTimelineItems)

  const [open, setOpen] = useState(false)

  const totalDuration = timelineItems.reduce((s, i) => {
    if (i.type === 'youtube' && i.loop) return s
    return s + (i.durationSec || 30)
  }, 0)

  const moveItem = (id, dir) => {
    const arr = [...timelineItems]
    const idx = arr.findIndex(i => i.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= arr.length) return
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    reorderTimelineItems(arr)
  }

  const addSlot = (type) => {
    const meta = getSlotMeta(type)
    addTimelineItem({
      type,
      label: meta.label,
      durationSec: meta.defaultDuration,
      loop: type === 'youtube' || type === 'video',
      muted: type === 'youtube',
    })
  }

  return (
    <>
      {/* Bottom trigger bar */}
      <div
        className="flex items-center gap-3 px-4 select-none cursor-pointer"
        style={{
          height: 36,
          borderTop: '1px solid rgba(173,179,180,.15)',
          backgroundColor: '#0c0f0f',
        }}
        onClick={() => setOpen(true)}
      >
        <ListVideo size={13} style={{ color: '#45546a', flexShrink: 0 }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#45546a' }}>
          Timeline de contenu
        </span>

        <div className="flex items-center gap-2 ml-1">
          <div
            className="rounded-full"
            style={{ width: 6, height: 6, backgroundColor: timelineEnabled ? '#10b981' : '#374151' }}
          />
          <span className="text-[10px]" style={{ color: '#45546a' }}>
            {timelineEnabled ? `Activée · ${timelineItems.length} slot${timelineItems.length !== 1 ? 's' : ''} · boucle ${formatDuration(totalDuration)}` : 'Désactivée'}
          </span>
        </div>

        <span className="ml-auto text-[11px] px-2 py-0.5 rounded"
          style={{ color: '#516076', backgroundColor: 'rgba(81,96,118,.12)' }}>
          Configurer →
        </span>
      </div>

      {/* Full-screen modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(5,7,8,.75)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: 480,
              maxWidth: '95vw',
              maxHeight: '90vh',
              backgroundColor: '#111827',
              border: '1px solid rgba(81,96,118,.25)',
              boxShadow: '0 32px 80px rgba(0,0,0,.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(81,96,118,.2)' }}>
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#e4e9ea' }}>
                  Timeline de contenu
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
                  Les slots défilent en boucle dans l'ordre.
                  {totalDuration > 0 && (
                    <> Durée totale : <strong style={{ color: '#9ca3af' }}>{formatDuration(totalDuration)}</strong></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MiniToggle
                  checked={timelineEnabled}
                  onChange={toggleTimeline}
                  label={timelineEnabled ? 'Activée' : 'Désactivée'}
                />
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: '#6b7280', backgroundColor: 'rgba(255,255,255,.05)' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Slot list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {timelineItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3"
                  style={{ color: '#6b7280' }}>
                  <ListVideo size={32} style={{ opacity: 0.4 }} />
                  <p className="text-[13px] text-center">
                    Aucun slot — ajoutez du contenu ci-dessous
                  </p>
                </div>
              ) : (
                timelineItems.map((item, idx) => (
                  <SlotCard
                    key={item.id}
                    item={item}
                    idx={idx}
                    total={timelineItems.length}
                    onChange={(changes) => updateTimelineItem(item.id, changes)}
                    onDelete={() => removeTimelineItem(item.id)}
                    onMoveUp={() => moveItem(item.id, -1)}
                    onMoveDown={() => moveItem(item.id, 1)}
                  />
                ))
              )}

              {/* Tip */}
              <div className="rounded-xl p-4 mt-2"
                style={{ backgroundColor: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)' }}>
                <div className="flex gap-3">
                  <Info size={14} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
                  <div className="text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>
                    <strong style={{ color: '#a5b4fc' }}>Astuce : </strong>
                    Pour YouTube en boucle infinie, activez l'option "Boucle" dans le slot.
                    La timeline remplace l'écran entier lors de l'affichage — le canvas reste visible entre les slots de type "Layout".
                  </div>
                </div>
              </div>
            </div>

            {/* Add buttons */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(81,96,118,.15)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#4b5563' }}>
                Ajouter un slot
              </p>
              <div className="flex flex-wrap gap-2">
                {SLOT_TYPES.map(({ type, label, emoji }) => (
                  <button
                    key={type}
                    onClick={() => addSlot(type)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
                    style={{
                      backgroundColor: 'rgba(255,255,255,.05)',
                      border: '1px solid rgba(255,255,255,.08)',
                      color: '#d1d5db',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.05)' }}
                  >
                    <span>{emoji}</span> + {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Slot card ──────────────────────────────────────────────────────────────

function SlotCard({ item, idx, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const meta = getSlotMeta(item.type)
  const [showMedia, setShowMedia] = useState(false)
  const [mediaTarget, setMediaTarget] = useState(null)

  const handleMediaSelect = (asset) => {
    if (mediaTarget === 'image') onChange({ imageUrl: asset.url })
    else if (mediaTarget === 'video') onChange({ videoUrl: asset.url })
    else if (typeof mediaTarget === 'number') {
      const imgs = [...(item.images || [])]
      imgs[mediaTarget] = asset.url
      onChange({ images: imgs })
    }
    setShowMedia(false)
  }

  const openMedia = (target) => { setMediaTarget(target); setShowMedia(true) }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#1f2937',
        border: `1px solid rgba(255,255,255,.06)`,
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5 px-4 py-3"
        style={{ backgroundColor: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize: 16 }}>{meta.emoji}</span>
        <span className="text-[13px] font-semibold flex-1" style={{ color: '#e5e7eb' }}>
          {meta.label}
        </span>
        {!(item.type === 'youtube' && item.loop) && (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,.06)', color: '#9ca3af' }}>
            <Clock size={10} /> {formatDuration(item.durationSec || 30)}
          </span>
        )}
        {item.type === 'youtube' && item.loop && (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(99,102,241,.15)', color: '#a5b4fc' }}>
            <Repeat size={10} /> Boucle ∞
          </span>
        )}
        {/* Move + delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp} disabled={idx === 0}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors disabled:opacity-20"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => { if (idx > 0) e.currentTarget.style.color = '#9ca3af' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}
          ><ChevronUp size={14} /></button>
          <button
            onClick={onMoveDown} disabled={idx === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors disabled:opacity-20"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => { if (idx < total - 1) e.currentTarget.style.color = '#9ca3af' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}
          ><ChevronDown size={14} /></button>
          <button
            onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}
          ><X size={14} /></button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        {/* Label + Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>
              Label affiché
            </label>
            <input
              type="text"
              value={item.label || ''}
              onChange={e => onChange({ label: e.target.value })}
              className="input-base w-full text-[13px]"
              placeholder={meta.label}
            />
          </div>
          {!(item.type === 'youtube' && item.loop) && (
            <div>
              <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>
                Durée (secondes)
              </label>
              <input
                type="number"
                value={item.durationSec || 30}
                onChange={e => onChange({ durationSec: Math.max(5, parseInt(e.target.value) || 30) })}
                className="input-base w-full text-[13px]"
                min={5}
              />
            </div>
          )}
        </div>

        {/* YouTube */}
        {item.type === 'youtube' && <YoutubeFields item={item} onChange={onChange} />}

        {/* Google Slides */}
        {item.type === 'slides' && <SlidesFields item={item} onChange={onChange} />}

        {/* Image */}
        {item.type === 'image' && (
          <ImageField item={item} onChange={onChange} onOpen={() => openMedia('image')} />
        )}

        {/* Video */}
        {item.type === 'video' && (
          <VideoField item={item} onChange={onChange} onOpen={() => openMedia('video')} />
        )}

        {/* Playlist */}
        {item.type === 'playlist' && (
          <PlaylistField item={item} onChange={onChange} onOpen={openMedia} />
        )}

        {/* Emergency */}
        {item.type === 'emergency' && (
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>Message d'urgence</label>
            <input
              type="text"
              value={item.message || ''}
              onChange={e => onChange({ message: e.target.value })}
              className="input-base w-full text-[13px]"
              placeholder="ÉVACUATION IMMÉDIATE"
            />
          </div>
        )}

        {/* Scheduling */}
        <ScheduleFields item={item} onChange={onChange} />
      </div>

      {showMedia && (
        <MediaLibrary
          accept={mediaTarget === 'video' ? 'video' : 'image'}
          title={mediaTarget === 'video' ? 'Choisir une vidéo' : 'Choisir une image'}
          onSelect={handleMediaSelect}
          onClose={() => setShowMedia(false)}
        />
      )}
    </div>
  )
}

// ── Field sub-components ───────────────────────────────────────────────────

function YoutubeFields({ item, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>
          URL ou ID de la vidéo YouTube
        </label>
        <input
          type="text"
          value={item.url || ''}
          onChange={e => onChange({ url: e.target.value })}
          className="input-base w-full text-[13px] font-mono"
          placeholder="https://youtube.com/watch?v=..."
        />
        <p className="text-[10px] mt-1" style={{ color: '#4b5563' }}>
          Collez l'URL de la vidéo depuis YouTube — l'ID sera extrait automatiquement
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <MiniToggle checked={!!item.loop} onChange={v => onChange({ loop: v })} label="Boucle infinie ∞" />
        <MiniToggle checked={!!item.muted} onChange={v => onChange({ muted: v })} label="Muet" />
        <MiniToggle checked={!!item.captions} onChange={v => onChange({ captions: v })} label="Activer les sous-titres (CC)" />
      </div>
      {item.captions && (
        <div>
          <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>Langue des sous-titres</label>
          <select
            value={item.captionsLang || 'fr'}
            onChange={e => onChange({ captionsLang: e.target.value })}
            className="input-base text-[13px]"
            style={{ width: '50%' }}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
          </select>
        </div>
      )}
    </div>
  )
}

function SlidesFields({ item, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>
          URL d'intégration Google Slides
        </label>
        <input
          type="text"
          value={item.embedUrl || ''}
          onChange={e => onChange({ embedUrl: e.target.value })}
          className="input-base w-full text-[13px] font-mono"
          placeholder="https://docs.google.com/presentation/d/e/2PACX-.../pub..."
        />
        <p className="text-[10px] mt-1" style={{ color: '#4b5563' }}>
          Fichier → Partager → Publier sur le web → Intégrer → copier l'URL <code>src</code>
        </p>
      </div>
      <div>
        <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>
          Délai entre diapositives (ms)
        </label>
        <input
          type="number"
          value={item.slidesDelayMs || 5000}
          onChange={e => onChange({ slidesDelayMs: Math.max(1000, parseInt(e.target.value) || 5000) })}
          className="input-base text-[13px]"
          style={{ width: '50%' }}
          min={1000} step={1000}
        />
      </div>
    </div>
  )
}

function ImageField({ item, onChange, onOpen }) {
  return (
    <div className="space-y-2">
      {item.imageUrl && (
        <div className="rounded-lg overflow-hidden relative" style={{ height: 80, backgroundColor: '#111827' }}>
          <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
          <button
            onClick={() => onChange({ imageUrl: '' })}
            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs"
            style={{ backgroundColor: 'rgba(220,38,38,.8)' }}
          >×</button>
        </div>
      )}
      <button onClick={onOpen} className="btn-secondary text-[12px] w-full justify-center gap-1.5">
        <Image size={12} /> {item.imageUrl ? 'Changer l\'image' : 'Choisir depuis la bibliothèque'}
      </button>
      {item.imageUrl && (
        <select value={item.fit || 'cover'} onChange={e => onChange({ fit: e.target.value })}
          className="input-base w-full text-[13px]">
          <option value="cover">Cover (remplir le cadre)</option>
          <option value="contain">Contain (tout voir)</option>
          <option value="fill">Fill (étirer)</option>
        </select>
      )}
    </div>
  )
}

function VideoField({ item, onChange, onOpen }) {
  return (
    <div className="space-y-2">
      {item.videoUrl && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.2)' }}>
          <Film size={13} style={{ color: '#8b5cf6' }} />
          <span className="text-[12px] flex-1 truncate" style={{ color: '#a78bfa' }}>
            {item.videoUrl.split('/').pop()}
          </span>
          <button onClick={() => onChange({ videoUrl: '' })} style={{ color: '#6b7280' }}><X size={11} /></button>
        </div>
      )}
      <button onClick={onOpen} className="btn-secondary text-[12px] w-full justify-center gap-1.5">
        <Film size={12} /> {item.videoUrl ? 'Changer la vidéo' : 'Choisir depuis la bibliothèque'}
      </button>
      <MiniToggle checked={item.loop !== false} onChange={v => onChange({ loop: v })} label="Boucle infinie" />
    </div>
  )
}

function PlaylistField({ item, onChange, onOpen }) {
  const images = item.images || []
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium block" style={{ color: '#6b7280' }}>Images du diaporama</label>
      {images.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {images.map((url, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              style={{ backgroundColor: 'rgba(20,184,166,.08)', border: '1px solid rgba(20,184,166,.12)' }}>
              <div className="w-10 h-7 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: '#111827' }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] flex-1 truncate" style={{ color: '#6b7280' }}>{url.split('/').pop()}</span>
              <button onClick={() => onOpen(i)} className="text-[10px]" style={{ color: '#6b7280' }}><Image size={10} /></button>
              <button
                onClick={() => { const imgs = [...images]; imgs.splice(i, 1); onChange({ images: imgs }) }}
                style={{ color: '#ef4444' }}
              ><X size={10} /></button>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => onOpen(images.length)} className="btn-secondary text-[12px] w-full justify-center gap-1.5">
        <Plus size={12} /> Ajouter une image
      </button>
      <div>
        <label className="text-[11px] font-medium block mb-1" style={{ color: '#6b7280' }}>Durée par image (sec)</label>
        <input
          type="number"
          value={item.intervalSec || 8}
          onChange={e => onChange({ intervalSec: Math.max(2, parseInt(e.target.value) || 8) })}
          className="input-base text-[13px]"
          style={{ width: '50%' }}
          min={2}
        />
      </div>
    </div>
  )
}

function ScheduleFields({ item, onChange }) {
  return (
    <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-medium" style={{ color: '#6b7280' }}>Programmation horaire</label>
        <MiniToggle checked={!!item.scheduleEnabled} onChange={v => onChange({ scheduleEnabled: v })} />
      </div>

      {item.scheduleEnabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: '#4b5563' }}>Début</label>
              <input type="time" value={item.scheduleStart || '08:00'}
                onChange={e => onChange({ scheduleStart: e.target.value })}
                className="input-base w-full text-[13px]" />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: '#4b5563' }}>Fin</label>
              <input type="time" value={item.scheduleEnd || '20:00'}
                onChange={e => onChange({ scheduleEnd: e.target.value })}
                className="input-base w-full text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[10px] block mb-1.5" style={{ color: '#4b5563' }}>Jours actifs</label>
            <div className="flex gap-1.5">
              {['L','M','M','J','V','S','D'].map((d, i) => {
                const day = i + 1
                const active = (item.scheduleDays || [1,2,3,4,5]).includes(day)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const days = item.scheduleDays || [1,2,3,4,5]
                      onChange({ scheduleDays: active ? days.filter(x => x !== day) : [...days, day].sort() })
                    }}
                    className="w-7 h-7 rounded-lg text-[11px] font-bold transition-colors"
                    style={{
                      backgroundColor: active ? '#6366f1' : 'rgba(99,102,241,.1)',
                      color: active ? '#fff' : '#6b7280',
                    }}
                  >{d}</button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimelineEditor
