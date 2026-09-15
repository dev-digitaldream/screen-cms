import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit2, X, Check, Shield, ChevronLeft } from 'lucide-react'

export default function UsersPanel({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'editor' })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function fetchUsers() {
    setLoading(true)
    fetch('/api/v1/auth/users', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Forbidden'); return r.json() })
      .then(data => { setUsers(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchUsers() }, [])

  function openCreate() {
    setForm({ username: '', password: '', role: 'editor' })
    setEditingId(null)
    setShowCreate(true)
  }

  function openEdit(user) {
    setForm({ username: user.username, password: '', role: user.role })
    setEditingId(user.id)
    setShowCreate(true)
  }

  async function handleSave() {
    if (!form.username.trim()) return
    if (!editingId && form.password.length < 6) return
    setSaving(true)
    try {
      const url = editingId ? `/api/v1/auth/users/${editingId}` : '/api/v1/auth/users'
      const method = editingId ? 'PUT' : 'POST'
      const body = { username: form.username, role: form.role }
      if (form.password) body.password = form.password
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setShowCreate(false)
      fetchUsers()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/v1/auth/users/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setDeleteConfirm(null)
      fetchUsers()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)', color: 'var(--ink)' }}>
      <header className="h-14 px-6 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--border-ghost)', backgroundColor: 'var(--surface-lowest)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost flex items-center gap-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
            <ChevronLeft size={16} /> Retour
          </button>
          <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-ghost)' }} />
          <Users size={16} style={{ color: 'var(--steel)' }} />
          <span className="font-semibold text-[15px]">Gestion des utilisateurs</span>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Nouvel utilisateur
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            Accès refusé — réservé aux administrateurs.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #dde4e5', borderTopColor: '#516076', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--surface-lowest)', border: '1px solid var(--border-ghost)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: u.role === 'admin' ? 'rgba(99,102,241,.15)' : 'rgba(82,82,91,.15)', color: u.role === 'admin' ? '#6366f1' : '#71717a' }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{u.username}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}>
                      {u.role === 'admin' && <Shield size={10} style={{ color: '#6366f1' }} />}
                      {u.role === 'admin' ? 'Administrateur' : 'Éditeur'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(u)} className="btn-ghost p-1.5" title="Modifier">
                    <Edit2 size={13} />
                  </button>
                  {deleteConfirm === u.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(u.id)} className="btn-ghost p-1.5" style={{ color: '#dc2626' }}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="btn-ghost p-1.5">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(u.id)} className="btn-ghost p-1.5" style={{ color: 'var(--ink-ghost)' }} title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: 'var(--surface-lowest)', boxShadow: '0 24px 48px rgba(0,0,0,.2)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>
                {editingId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--ink-muted)' }}>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="input w-full"
                  placeholder="username"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--ink-muted)' }}>
                  Mot de passe {editingId && <span style={{ color: 'var(--ink-ghost)' }}>(laisser vide = inchangé)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input w-full"
                  placeholder={editingId ? '••••••' : 'min. 6 caractères'}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--ink-muted)' }}>Rôle</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="input w-full"
                >
                  <option value="editor">Éditeur — peut créer et modifier des écrans</option>
                  <option value="admin">Administrateur — accès complet</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? 'Sauvegarde…' : editingId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
