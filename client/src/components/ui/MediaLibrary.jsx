import { useEffect, useRef, useState } from 'react'
import { useMediaLibrary } from '@/hooks/useMediaLibrary'
import { Upload, X, Trash2, Image, Film, Search, Plus, GripVertical } from 'lucide-react'

const MIME_ICONS = {
  'image': Image,
  'video': Film,
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function AssetCard({ asset, selected, onSelect, onDelete }) {
  const isVideo = asset.mimetype?.startsWith('video/')
  const isImage = asset.mimetype?.startsWith('image/')
  return (
    <div
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-all"
      style={{
        backgroundColor: 'var(--surface-high)',
        aspectRatio: '4/3',
        border: selected ? '2px solid var(--steel)' : '2px solid transparent',
        boxShadow: selected ? '0 0 0 1px var(--steel-light-dim)' : 'none',
      }}
      onClick={() => onSelect(asset)}
    >
      {isImage && (
        <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" loading="lazy" />
      )}
      {isVideo && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ color: 'var(--ink-muted)' }}>
          <Film size={24} />
          <span className="text-[10px] px-2 text-center truncate w-full" style={{ color: 'var(--ink-subtle)' }}>
            {asset.filename}
          </span>
        </div>
      )}
      {/* Overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end"
        style={{ background: 'linear-gradient(to top, rgba(45,52,53,.7), transparent)' }}
      >
        <div className="p-1.5 flex items-center justify-between">
          <span className="text-[9px] text-white/80 truncate flex-1">{formatSize(asset.size)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(asset.id) }}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/80 text-white/70 hover:text-white transition-colors flex-shrink-0"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: 'var(--steel)' }}
        >✓</div>
      )}
    </div>
  )
}

/**
 * MediaLibrary modal
 * Props:
 *   onSelect(asset) — called when user confirms selection
 *   onClose() — close modal
 *   accept — 'image' | 'video' | 'all' (default: 'all')
 *   title — modal title
 */
export function MediaLibrary({ onSelect, onClose, accept = 'all', title = 'Bibliothèque media' }) {
  const { assets, loading, uploading, error, refresh, upload, remove } = useMediaLibrary()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { refresh() }, [refresh])

  const filtered = assets.filter(a => {
    if (accept === 'image' && !a.mimetype?.startsWith('image/')) return false
    if (accept === 'video' && !a.mimetype?.startsWith('video/')) return false
    if (search) return a.filename.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const handleDrop = async (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const f of files) {
      try { await upload(f) } catch {}
    }
  }

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const f of files) {
      try { await upload(f) } catch {}
    }
    e.target.value = ''
  }

  const handleConfirm = () => {
    if (selected) { onSelect(selected); onClose() }
  }

  const acceptAttr = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(45,52,53,.5)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden w-[720px] max-w-[95vw] max-h-[85vh]"
        style={{ backgroundColor: 'var(--surface-lowest)', boxShadow: '0 24px 60px rgba(45,52,53,.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--surface-high)' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</h2>
          <button onClick={onClose} className="btn-ghost"><X size={16} /></button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--surface-high)', backgroundColor: 'var(--surface)' }}>
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 rounded px-2.5 py-1.5" style={{ backgroundColor: 'var(--surface-highest)' }}>
            <Search size={13} style={{ color: 'var(--ink-subtle)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-transparent border-none outline-none text-[12px] flex-1"
              style={{ color: 'var(--ink)' }}
            />
          </div>
          {/* Upload button */}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-[12px] gap-1.5"
          >
            {uploading
              ? <span className="w-3 h-3 rounded-full border border-white/40 border-t-white animate-spin" />
              : <Upload size={13} />
            }
            {uploading ? 'Upload…' : 'Uploader'}
          </button>
          <input ref={inputRef} type="file" multiple accept={acceptAttr} className="hidden" onChange={handleFileInput} />
        </div>

        {/* Grid */}
        <div
          className="flex-1 overflow-y-auto p-4"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {error && (
            <div className="mb-3 px-3 py-2 rounded text-[12px]" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {loading && !assets.length ? (
            <div className="flex items-center justify-center h-40 gap-2" style={{ color: 'var(--ink-subtle)' }}>
              <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span className="text-[13px]">Chargement…</span>
            </div>
          ) : filtered.length === 0 ? (
            /* Drop zone when empty */
            <div
              className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed gap-3 cursor-pointer"
              style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink-subtle)' }}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={28} />
              <div className="text-center">
                <p className="text-[13px] font-medium" style={{ color: 'var(--ink-muted)' }}>Déposez des fichiers ici</p>
                <p className="text-[11px]">ou cliquez pour uploader</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {filtered.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selected?.id === asset.id}
                  onSelect={setSelected}
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid var(--surface-high)', backgroundColor: 'var(--surface)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--ink-subtle)' }}>
            {filtered.length} fichier{filtered.length !== 1 ? 's' : ''}
            {selected && <> · <span style={{ color: 'var(--steel)' }}>{selected.filename}</span></>}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-[12px]">Annuler</button>
            <button onClick={handleConfirm} disabled={!selected} className="btn-primary text-[12px]"
              style={!selected ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Sélectionner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline button that opens MediaLibrary and shows preview
 */
export function MediaPickerField({ label, value, onChange, accept = 'all' }) {
  const [open, setOpen] = useState(false)

  const isVideo = value && (value.endsWith('.mp4') || value.endsWith('.webm'))
  const hasValue = !!value

  return (
    <div>
      {label && <label className="section-label block mb-1.5">{label}</label>}
      <div className="space-y-2">
        {hasValue && (
          <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-high)', height: 80 }}>
            {!isVideo ? (
              <img src={value} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center gap-1.5" style={{ color: 'var(--ink-muted)' }}>
                <Film size={20} />
                <span className="text-[11px]">Vidéo</span>
              </div>
            )}
            <button
              onClick={() => onChange('')}
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: 'rgba(220,38,38,.8)' }}
            >×</button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="btn-secondary text-[12px] gap-1.5 flex-1 justify-center"
          >
            <Image size={12} />
            {hasValue ? 'Changer…' : 'Choisir depuis la bibliothèque'}
          </button>
        </div>
      </div>
      {open && (
        <MediaLibrary
          accept={accept}
          onSelect={(asset) => onChange(asset.url)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

/**
 * Multi-select media picker — returns array of URLs
 */
export function MediaPickerMultiField({ label, value = [], onChange, accept = 'image' }) {
  const [open, setOpen] = useState(false)

  const handleAdd = (asset) => {
    if (!value.includes(asset.url)) {
      onChange([...value, asset.url])
    }
    setOpen(false)
  }

  const handleRemove = (url) => {
    onChange(value.filter(u => u !== url))
  }

  const moveUp = (i) => {
    if (i === 0) return
    const next = [...value]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }

  const moveDown = (i) => {
    if (i === value.length - 1) return
    const next = [...value]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onChange(next)
  }

  return (
    <div>
      {label && <label className="section-label block mb-1.5">{label}</label>}
      <div className="space-y-1.5 mb-2">
        {value.map((url, i) => (
          <div key={url} className="flex items-center gap-1.5 rounded-lg p-1" style={{ backgroundColor: 'var(--surface-high)' }}>
            <img src={url} alt="" className="w-10 h-8 object-cover rounded flex-shrink-0" />
            <span className="text-[10px] flex-1 truncate font-mono" style={{ color: 'var(--ink-muted)' }}>
              {url.split('/').pop()}
            </span>
            <button onClick={() => moveUp(i)} className="btn-ghost p-0.5" title="Monter">▲</button>
            <button onClick={() => moveDown(i)} className="btn-ghost p-0.5" title="Descendre">▼</button>
            <button onClick={() => handleRemove(url)} className="btn-ghost p-0.5 text-red-400" title="Retirer">×</button>
          </div>
        ))}
      </div>
      <button onClick={() => setOpen(true)} className="btn-secondary text-[12px] gap-1.5 w-full justify-center">
        <Plus size={12} /> Ajouter une image
      </button>
      {open && (
        <MediaLibrary
          accept={accept}
          onSelect={handleAdd}
          onClose={() => setOpen(false)}
          title="Ajouter une image au diaporama"
        />
      )}
    </div>
  )
}
