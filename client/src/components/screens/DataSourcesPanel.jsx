import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const AUTH_TYPES = [
  { value: 'none', label: 'Aucune' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'basic', label: 'Basic (user:pass)' },
  { value: 'apikey', label: 'API Key (Header:value)' },
]

const EMPTY = {
  name: '', url: '', method: 'GET', auth_type: 'none', auth_value: '',
  refresh_s: 60, transform_js: '', headers: {},
}

function ago(dateStr) {
  if (!dateStr) return 'Jamais'
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (s < 60) return `il y a ${s}s`
  if (s < 3600) return `il y a ${Math.floor(s / 60)}min`
  return `il y a ${Math.floor(s / 3600)}h`
}

function DataSourceForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [extraHeader, setExtraHeader] = useState({ key: '', value: '' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addHeader = () => {
    if (!extraHeader.key) return
    setForm(f => ({ ...f, headers: { ...f.headers, [extraHeader.key]: extraHeader.value } }))
    setExtraHeader({ key: '', value: '' })
  }
  const removeHeader = (k) => setForm(f => {
    const h = { ...f.headers }; delete h[k]; return { ...f, headers: h }
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Nom</label>
          <input className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
            value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Tickets HubSpot" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Refresh (secondes)</label>
          <input type="number" min="10" className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
            value={form.refresh_s} onChange={e => set('refresh_s', parseInt(e.target.value) || 60)} />
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-400 block mb-1">URL</label>
        <div className="flex gap-2">
          <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
            value={form.method} onChange={e => set('method', e.target.value)}>
            {['GET', 'POST', 'PUT'].map(m => <option key={m}>{m}</option>)}
          </select>
          <input className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white font-mono"
            value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://api.example.com/data" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Authentification</label>
          <select className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
            value={form.auth_type} onChange={e => set('auth_type', e.target.value)}>
            {AUTH_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        {form.auth_type !== 'none' && (
          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              {form.auth_type === 'bearer' ? 'Token' : form.auth_type === 'basic' ? 'user:password' : 'Header:value'}
            </label>
            <input type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white font-mono"
              value={form.auth_value || ''} onChange={e => set('auth_value', e.target.value)} placeholder="…" />
          </div>
        )}
      </div>

      {/* Extra headers */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">Headers personnalisés</label>
        {Object.entries(form.headers || {}).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-zinc-300 flex-1">{k}: {v}</span>
            <button onClick={() => removeHeader(k)} className="text-zinc-500 hover:text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
            placeholder="Header" value={extraHeader.key} onChange={e => setExtraHeader(h => ({ ...h, key: e.target.value }))} />
          <input className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
            placeholder="Value" value={extraHeader.value} onChange={e => setExtraHeader(h => ({ ...h, value: e.target.value }))} />
          <button onClick={addHeader} className="text-xs bg-zinc-700 hover:bg-zinc-600 rounded px-2 py-1 text-white">+</button>
        </div>
      </div>

      {/* Transform JS */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">
          Transform JS <span className="text-zinc-600">(optionnel — fn(data) =&gt; value)</span>
        </label>
        <textarea rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white font-mono resize-none"
          value={form.transform_js || ''} onChange={e => set('transform_js', e.target.value)}
          placeholder="(data) => data.results[0].value" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded px-3 py-1.5 text-sm text-white font-medium">
          Enregistrer
        </button>
        <button onClick={onCancel}
          className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded">
          Annuler
        </button>
      </div>
    </div>
  )
}

function DataSourceRow({ ds, onRefresh, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  const statusColor = ds.last_error ? 'text-red-400' : ds.last_fetched_at ? 'text-green-400' : 'text-zinc-500'
  const StatusIcon = ds.last_error ? AlertCircle : ds.last_fetched_at ? CheckCircle2 : Clock

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh(ds.id)
    // Load preview
    const r = await fetch(`/api/v1/datasources/${ds.id}/data`)
    const j = await r.json()
    setPreviewData(j.data)
    setRefreshing(false)
    setExpanded(true)
  }

  const loadPreview = async () => {
    if (!expanded) {
      const r = await fetch(`/api/v1/datasources/${ds.id}/data`)
      const j = await r.json()
      setPreviewData(j.data)
    }
    setExpanded(e => !e)
  }

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800/60 cursor-pointer"
        onClick={loadPreview}>
        <button className="text-zinc-500 shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <StatusIcon size={14} className={statusColor} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{ds.name}</div>
          <div className="text-xs text-zinc-500 truncate font-mono">{ds.url}</div>
        </div>
        <div className="text-xs text-zinc-500 shrink-0">{ago(ds.last_fetched_at)}</div>
        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => onEdit(ds)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-medium px-2">
            Éditer
          </button>
          <button onClick={() => onDelete(ds.id)}
            className="p-1.5 rounded hover:bg-zinc-700 text-red-500 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-3 bg-zinc-950">
          {ds.last_error && (
            <div className="text-xs text-red-400 mb-2 font-mono">Erreur: {ds.last_error}</div>
          )}
          <div className="text-xs text-zinc-500 mb-1">
            ID: <span className="font-mono text-zinc-400 select-all">{ds.id}</span>
            <span className="ml-3">Refresh: {ds.refresh_s}s</span>
          </div>
          {previewData !== null && (
            <pre className="text-xs text-zinc-300 font-mono overflow-auto max-h-48 bg-black/40 rounded p-2 mt-2">
              {JSON.stringify(previewData, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default function DataSourcesPanel() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    const r = await fetch('/api/v1/datasources')
    if (r.ok) setSources(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `/api/v1/datasources/${editing.id}` : '/api/v1/datasources'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setCreating(false)
    setEditing(null)
    load()
  }

  const handleRefresh = async (id) => {
    await fetch(`/api/v1/datasources/${id}/refresh`, { method: 'POST' })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette source de données ?')) return
    await fetch(`/api/v1/datasources/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Chargement…</div>

  return (
    <div className="p-4 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Sources de données</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Connectez des APIs externes (CRM, ERP, REST) pour alimenter vos widgets KPI et Ticketing.
          </p>
        </div>
        <button onClick={() => { setCreating(true); setEditing(null) }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium">
          <Plus size={15} /> Nouvelle source
        </button>
      </div>

      {(creating || editing) && (
        <div className="border border-indigo-500/30 bg-zinc-900/80 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            {editing ? 'Modifier la source' : 'Nouvelle source de données'}
          </h3>
          <DataSourceForm
            initial={editing || {}}
            onSave={handleSave}
            onCancel={() => { setCreating(false); setEditing(null) }}
          />
        </div>
      )}

      {sources.length === 0 && !creating && (
        <div className="text-center py-12 text-zinc-600">
          <p className="text-sm">Aucune source de données.</p>
          <p className="text-xs mt-1">Ajoutez une API REST pour commencer.</p>
        </div>
      )}

      <div className="space-y-2">
        {sources.map(ds => (
          <DataSourceRow
            key={ds.id}
            ds={ds}
            onRefresh={handleRefresh}
            onDelete={handleDelete}
            onEdit={(ds) => { setEditing(ds); setCreating(false) }}
          />
        ))}
      </div>
    </div>
  )
}
