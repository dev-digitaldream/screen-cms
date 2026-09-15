import { useState, useEffect } from 'react'
import { Plus, Tv, Edit3, Trash2, Copy, Eye, Monitor, Clock, BarChart2, Cloud, Database, Link, Users } from 'lucide-react'
import { TEMPLATES, applyTemplate } from '@/lib/templates'

export default function ScreensList({ onOpenEditor, onOpenDevices, onOpenDataSources, onOpenUsers }) {
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function fetchScreens() {
    fetch('/api/v1/screens', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setScreens(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchScreens() }, [])

  function slugify(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
  }

  async function handleCreate() {
    if (!newName.trim() || !newSlug.trim()) return
    setCreating(true)
    try {
      const layout = selectedTemplate
        ? applyTemplate(selectedTemplate)
        : { screenConfig: { slug: newSlug, name: newName, backgroundColor: '#0a0a0e', theme: 'dark', resolution: 'fhd' }, widgets: {}, widgetOrder: [] }

      layout.screenConfig = { ...layout.screenConfig, slug: newSlug, name: newName }

      const res = await fetch('/api/v1/screens', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug, name: newName, layout }),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewName('')
        setNewSlug('')
        setSelectedTemplate(null)
        fetchScreens()
        const data = await res.json()
        onOpenEditor(newSlug)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDuplicate(screen) {
    const newS = `${screen.slug}-copy`
    const newN = `${screen.name} (copie)`
    const layout = await fetch(`/api/v1/screens/${screen.slug}`, { credentials: 'include' }).then(r => r.json())
    layout.screenConfig = { ...layout.screenConfig, slug: newS, name: newN }
    await fetch('/api/v1/screens', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: newS, name: newN, layout }),
    })
    fetchScreens()
  }

  async function handleDelete(slug) {
    await fetch(`/api/v1/screens/${slug}`, { method: 'DELETE', credentials: 'include' })
    setDeleteConfirm(null)
    fetchScreens()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)', color: 'var(--ink)' }}>
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-ghost)', backgroundColor: 'var(--surface-lowest)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #5f5e5e, #535252)' }}>
            <Monitor size={14} className="text-white" />
          </div>
          <span className="font-semibold text-[15px]">SignagePro</span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenUsers && (
            <button onClick={onOpenUsers} className="btn-secondary flex items-center gap-2">
              <Users size={14} /> Utilisateurs
            </button>
          )}
          {onOpenDataSources && (
            <button onClick={onOpenDataSources} className="btn-secondary flex items-center gap-2">
              <Database size={14} /> Sources de données
            </button>
          )}
          {onOpenDevices && (
            <button
              onClick={onOpenDevices}
              className="btn-secondary flex items-center gap-2"
            >
              <Tv size={14} /> Appareils
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nouvel écran
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Mes écrans</h1>
          <p style={{ color: 'var(--ink-muted)' }}>{screens.length} écran{screens.length !== 1 ? 's' : ''} configuré{screens.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #dde4e5', borderTopColor: '#516076', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : screens.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {screens.map(screen => (
              <ScreenCard
                key={screen.slug}
                screen={screen}
                onEdit={() => onOpenEditor(screen.slug)}
                onPreview={() => window.open(`/display/${screen.slug}?t=${screen.display_token}`, '_blank')}
                onDuplicate={() => handleDuplicate(screen)}
                onDelete={() => setDeleteConfirm(screen.slug)}
              />
            ))}
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors hover:border-indigo-400"
              style={{ borderColor: 'var(--border-ghost)', color: 'var(--ink-subtle)', minHeight: 160 }}
            >
              <Plus size={28} style={{ color: 'var(--ink-muted)' }} />
              <span className="text-sm font-medium">Nouvel écran</span>
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface-lowest)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-ghost)' }}>
              <h2 className="text-lg font-semibold">Créer un nouvel écran</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>Choisissez un template ou partez de zéro</p>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-muted)' }}>Nom de l'écran</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)) }}
                    placeholder="Hall d'entrée"
                    className="input-base w-full"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-muted)' }}>Slug (URL)</label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={e => setNewSlug(slugify(e.target.value))}
                    placeholder="hall-entree"
                    className="input-base w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--ink-muted)' }}>Template de départ</label>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  <TemplateCard
                    id={null}
                    name="Vierge"
                    description="Canvas vide"
                    emoji="⬜"
                    selected={selectedTemplate === null}
                    onClick={() => setSelectedTemplate(null)}
                  />
                  {TEMPLATES.map(t => (
                    <TemplateCard
                      key={t.id}
                      id={t.id}
                      name={t.name}
                      description={t.description}
                      emoji={t.emoji}
                      selected={selectedTemplate === t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-ghost)' }}>
              <button onClick={() => { setShowCreate(false); setNewName(''); setNewSlug(''); setSelectedTemplate(null) }} className="btn-secondary">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newSlug.trim() || creating}
                className="btn-primary"
              >
                {creating ? 'Création...' : 'Créer l\'écran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="rounded-2xl p-6 w-80 shadow-2xl" style={{ backgroundColor: 'var(--surface-lowest)' }}>
            <h3 className="font-semibold mb-2">Supprimer cet écran ?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-lg px-3 py-1.5 text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScreenCard({ screen, onEdit, onPreview, onDuplicate, onDelete }) {
  const [copied, setCopied] = useState(false)
  const updatedAt = screen.updated_at ? new Date(screen.updated_at).toLocaleDateString('fr', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

  function copyDisplayUrl() {
    const url = `${window.location.origin}/display/${screen.slug}?t=${screen.display_token}`
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // Build background style from extracted DB fields
  let thumbBg
  if (screen.background_type === 'gradient' && screen.gradient_color1) {
    thumbBg = `linear-gradient(${screen.gradient_dir || '135deg'}, ${screen.gradient_color1}, ${screen.gradient_color2 || '#1a2030'})`
  } else {
    thumbBg = screen.background_color || '#0f172a'
  }

  return (
    <div className="rounded-xl border overflow-hidden group transition-all hover:shadow-md"
      style={{ borderColor: 'var(--border-ghost)', backgroundColor: 'var(--surface-low)' }}>
      {/* Preview thumbnail */}
      <div
        className="h-36 flex items-center justify-center cursor-pointer relative"
        style={{ background: thumbBg }}
        onClick={onEdit}
      >
        <Tv size={36} style={{ color: 'rgba(255,255,255,0.12)' }} />
        {screen.widget_count > 0 && (
          <div className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-mono"
            style={{ backgroundColor: 'rgba(0,0,0,.4)', color: 'rgba(255,255,255,.5)' }}>
            {screen.widget_count} widget{screen.widget_count > 1 ? 's' : ''}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,.4)' }}>
          <button onClick={e => { e.stopPropagation(); onEdit() }} className="btn-primary text-xs flex items-center gap-1.5">
            <Edit3 size={12} /> Éditer
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>{screen.name}</h3>
        </div>
        <p className="text-xs font-mono mb-1" style={{ color: 'var(--ink-subtle)' }}>/{screen.slug}</p>
        {screen.display_token && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--ink-ghost)', border: '1px solid var(--border-ghost)' }}>
              🔒 ?t={screen.display_token}
            </span>
            <button onClick={copyDisplayUrl} className="btn-ghost p-0.5 rounded text-[10px] flex items-center gap-0.5" title="Copier l'URL complète" style={{ color: copied ? '#22c55e' : 'var(--ink-muted)' }}>
              {copied ? '✓' : <Link size={10} />}
            </button>
          </div>
        )}
        {updatedAt && <p className="text-[10px] mb-3" style={{ color: 'var(--ink-ghost)' }}>Modifié {updatedAt}</p>}

        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5 py-1.5">
            <Edit3 size={11} /> Éditer
          </button>
          <button onClick={onPreview} className="btn-ghost p-1.5" title="Prévisualiser">
            <Eye size={14} />
          </button>
          <button onClick={onDuplicate} className="btn-ghost p-1.5" title="Dupliquer">
            <Copy size={14} />
          </button>
          <button onClick={onDelete} className="btn-ghost p-1.5 text-red-400 hover:text-red-500" title="Supprimer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ id, name, description, emoji, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-3 text-left border-2 transition-all"
      style={{
        borderColor: selected ? '#6366f1' : 'var(--border-ghost)',
        backgroundColor: selected ? 'rgba(99,102,241,.08)' : 'var(--surface-low)',
      }}
    >
      <div className="text-2xl mb-1.5">{emoji}</div>
      <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{name}</div>
      <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>{description}</div>
    </button>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface-low)' }}>
        <Tv size={28} style={{ color: 'var(--ink-muted)' }} />
      </div>
      <h2 className="text-lg font-semibold">Aucun écran</h2>
      <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Créez votre premier écran TV</p>
      <button onClick={onCreate} className="btn-primary flex items-center gap-2">
        <Plus size={15} /> Créer un écran
      </button>
    </div>
  )
}
