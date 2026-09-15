import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Tv, RefreshCw, QrCode, ChevronLeft, Wifi, WifiOff,
  Settings, FileText, Trash2, Save, X, Check, Cpu, Monitor, RotateCcw, Eraser
} from 'lucide-react'

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(isoStr) {
  if (!isoStr) return 'jamais'
  const diff = Date.now() - new Date(isoStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5) return 'à l\'instant'
  if (s < 60) return `il y a ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hors ligne depuis ${h}h`
  return `hors ligne depuis ${Math.floor(h / 24)}j`
}

function onlineStatus(lastSeen) {
  if (!lastSeen) return 'offline'
  const diff = Date.now() - new Date(lastSeen).getTime()
  if (diff < 90_000) return 'online'
  if (diff < 5 * 60_000) return 'recent'
  return 'offline'
}

function StatusDot({ status }) {
  const colors = {
    online: '#10b981',
    recent: '#f59e0b',
    offline: '#ef4444',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: colors[status] || colors.offline,
        boxShadow: status === 'online' ? `0 0 6px ${colors.online}` : 'none',
        flexShrink: 0,
      }}
    />
  )
}

function MemBar({ used, total }) {
  if (!total) return null
  const pct = Math.min(100, Math.round((used / total) * 100))
  const color = pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        flex: 1, height: 4, borderRadius: 99,
        backgroundColor: 'var(--surface-high)',
        overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 99, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
        {used}M / {total}M
      </span>
    </div>
  )
}

// ─── QR Code modal (uses canvas fallback if no qrcode lib) ───────────────────

function QrModal({ url, onClose }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !url) return
    // Try to use qrcode lib if available, else show URL text only
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2, color: { dark: '#000', light: '#fff' } })
        .catch(() => {})
    }).catch(() => {})
  }, [url])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.6)' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: 'var(--surface-lowest)', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Télécharger l'APK</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <canvas ref={canvasRef} width={256} height={256} style={{ borderRadius: 8 }} />
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {url}
        </p>
      </div>
    </div>
  )
}

// ─── Logs modal ───────────────────────────────────────────────────────────────

function LogsModal({ device, onClose, onClear }) {
  const bottomRef = useRef(null)
  const logs = device?.logs || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  function levelColor(level) {
    if (level === 'e' || level === 'error') return '#ef4444'
    if (level === 'w' || level === 'warn' || level === 'warning') return '#f59e0b'
    return '#10b981'
  }

  function levelLabel(level) {
    if (level === 'e' || level === 'error') return 'ERR'
    if (level === 'w' || level === 'warn' || level === 'warning') return 'WRN'
    return 'INF'
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.6)' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: 'var(--surface-lowest)', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '80vh', display: 'flex', flexDirection: 'column', margin: 16 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Logs — {device?.name}</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-muted)' }}>{logs.length} entrée{logs.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClear}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-ghost)', backgroundColor: 'var(--surface-low)', color: 'var(--ink-muted)', cursor: 'pointer' }}
            >
              Effacer les logs
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Logs area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#0a0a0e',
          fontFamily: 'monospace',
          fontSize: 12,
          padding: 16,
          lineHeight: 1.6,
        }}>
          {logs.length === 0 ? (
            <p style={{ color: '#334155', textAlign: 'center', marginTop: 40 }}>Aucun log disponible</p>
          ) : (
            logs.slice(-200).map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                <span style={{ color: '#334155', flexShrink: 0, userSelect: 'none' }}>{log.ts || ''}</span>
                <span style={{ color: levelColor(log.level), flexShrink: 0, fontWeight: 700, userSelect: 'none' }}>[{levelLabel(log.level)}]</span>
                <span style={{ color: '#94a3b8', wordBreak: 'break-word' }}>{log.msg}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

// ─── Config panel (inline expanded) ──────────────────────────────────────────

function ConfigPanel({ device, screens, onSave, onCancel }) {
  const cfg = device.config || {}
  const [name, setName] = useState(device.name || '')
  const [slug, setSlug] = useState(cfg.slug || '')
  const [scheduleEnabled, setScheduleEnabled] = useState(cfg.scheduleEnabled || false)
  const [scheduleDays, setScheduleDays] = useState(
    cfg.scheduleDays ? cfg.scheduleDays.split(',').map(d => d.trim()) : ['1', '2', '3', '4', '5']
  )
  const [scheduleStart, setScheduleStart] = useState(cfg.scheduleStart || '08:00')
  const [scheduleEnd, setScheduleEnd] = useState(cfg.scheduleEnd || '18:00')
  const [standbyMessage, setStandbyMessage] = useState(cfg.standbyMessage || 'Écran en veille')
  const [saving, setSaving] = useState(false)

  function toggleDay(d) {
    setScheduleDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        name,
        config: {
          slug,
          scheduleEnabled,
          scheduleDays: scheduleDays.sort().join(','),
          scheduleStart,
          scheduleEnd,
          standbyMessage,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      padding: '16px 20px',
      backgroundColor: 'var(--surface-dim)',
      borderTop: '1px solid var(--border-ghost)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Device name */}
        <div>
          <label style={labelStyle}>Nom de l'appareil</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Écran affiché (slug)</label>
          <select
            value={slug}
            onChange={e => setSlug(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Aucun —</option>
            {screens.map(s => (
              <option key={s.slug} value={s.slug}>{s.name} ({s.slug})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={e => setScheduleEnabled(e.target.checked)}
            style={{ accentColor: '#6366f1', width: 14, height: 14 }}
          />
          Activer la planification horaire
        </label>
      </div>

      {scheduleEnabled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto 1fr', gap: 12, alignItems: 'end', marginBottom: 16 }}>
          {/* Days */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Jours actifs</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS_FR.map((day, i) => {
                const dayNum = String(i + 1)
                const active = scheduleDays.includes(dayNum)
                return (
                  <button
                    key={dayNum}
                    onClick={() => toggleDay(dayNum)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid',
                      cursor: 'pointer',
                      borderColor: active ? '#6366f1' : 'var(--border-ghost)',
                      backgroundColor: active ? 'rgba(99,102,241,.15)' : 'var(--surface-low)',
                      color: active ? '#818cf8' : 'var(--ink-muted)',
                    }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Start / End */}
          <div>
            <label style={labelStyle}>Heure début</label>
            <input
              type="time"
              value={scheduleStart}
              onChange={e => setScheduleStart(e.target.value)}
              style={inputStyle}
            />
          </div>
          <span style={{ paddingBottom: 10, color: 'var(--ink-muted)', fontSize: 13 }}>→</span>
          <div>
            <label style={labelStyle}>Heure fin</label>
            <input
              type="time"
              value={scheduleEnd}
              onChange={e => setScheduleEnd(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Standby message */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Message de veille</label>
            <input
              value={standbyMessage}
              onChange={e => setStandbyMessage(e.target.value)}
              placeholder="Écran en veille"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnSecondaryStyle}>Annuler</button>
        <button onClick={handleSave} disabled={saving} style={btnPrimaryStyle}>
          {saving ? 'Enregistrement...' : (
            <><Save size={13} style={{ marginRight: 6 }} />Enregistrer</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Device Card ──────────────────────────────────────────────────────────────

function DeviceCard({ device, screens, onRefresh, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const status = onlineStatus(device.last_seen)

  async function handleSaveConfig(payload) {
    await fetch(`/api/v1/devices/${device.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setExpanded(false)
    onRefresh()
  }

  async function handleClearLogs() {
    await fetch(`/api/v1/devices/${device.id}/logs`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setShowLogs(false)
    onRefresh()
  }

  async function handleForceReload() {
    const cfg = device.config || {}
    await fetch(`/api/v1/devices/${device.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { ...cfg, forceReload: true } }),
    })
    onRefresh()
  }

  async function handleClearCache() {
    const cfg = device.config || {}
    await fetch(`/api/v1/devices/${device.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { ...cfg, clearCache: true } }),
    })
    onRefresh()
  }

  async function handleDelete() {
    await fetch(`/api/v1/devices/${device.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    onRefresh()
  }

  return (
    <>
      <div style={{
        borderRadius: 12,
        border: '1px solid var(--border-ghost)',
        backgroundColor: 'var(--surface-low)',
        overflow: 'hidden',
      }}>
        {/* Main row */}
        <div style={{ padding: '14px 16px' }}>
          {/* Top row: status + name + badges */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <StatusDot status={status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', wordBreak: 'break-word' }}>
                  {device.name}
                </span>
                {device.model && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: '1px 6px', borderRadius: 4,
                    backgroundColor: 'var(--surface-highest)',
                    color: 'var(--ink-muted)',
                  }}>
                    {device.model}
                  </span>
                )}
                {device.android_version && (
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px', borderRadius: 4,
                    backgroundColor: 'rgba(99,102,241,.1)',
                    color: '#818cf8',
                  }}>
                    Android {device.android_version}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                {device.loaded_slug && (
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'monospace' }}>
                    /{device.loaded_slug}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--ink-subtle)' }}>
                  {relativeTime(device.last_seen)}
                </span>
                {device.last_ip && (
                  <span style={{ fontSize: 11, color: 'var(--ink-ghost)', fontFamily: 'monospace' }}>
                    {device.last_ip}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Memory bar */}
          {device.mem_total_mb > 0 && (
            <div style={{ marginBottom: 12 }}>
              <MemBar used={device.mem_used_mb} total={device.mem_total_mb} />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                ...btnSecondarySmallStyle,
                borderColor: expanded ? '#6366f1' : undefined,
                color: expanded ? '#818cf8' : undefined,
              }}
            >
              <Settings size={12} style={{ marginRight: 4 }} />
              Configurer
            </button>
            <button onClick={handleForceReload} title="Force reload dans ~1 min" style={btnSecondarySmallStyle}>
              <RotateCcw size={12} style={{ marginRight: 4 }} />
              Reload
            </button>
            <button onClick={handleClearCache} title="Vider le cache WebView + recharger" style={btnSecondarySmallStyle}>
              <Eraser size={12} style={{ marginRight: 4 }} />
              Vider cache
            </button>
            <button onClick={() => setShowLogs(true)} style={btnSecondarySmallStyle}>
              <FileText size={12} style={{ marginRight: 4 }} />
              Logs {device.logs?.length > 0 && `(${device.logs.length})`}
            </button>
            {deleteConfirm ? (
              <>
                <button
                  onClick={handleDelete}
                  style={{ ...btnSecondarySmallStyle, color: '#ef4444', borderColor: '#ef4444' }}
                >
                  <Check size={12} style={{ marginRight: 4 }} />
                  Confirmer
                </button>
                <button onClick={() => setDeleteConfirm(false)} style={btnSecondarySmallStyle}>
                  <X size={12} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{ ...btnSecondarySmallStyle, color: '#ef4444' }}
              >
                <Trash2 size={12} style={{ marginRight: 4 }} />
                Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Config panel (inline expanded) */}
        {expanded && (
          <ConfigPanel
            device={device}
            screens={screens}
            onSave={handleSaveConfig}
            onCancel={() => setExpanded(false)}
          />
        )}
      </div>

      {/* Logs modal */}
      {showLogs && (
        <LogsModal
          device={device}
          onClose={() => setShowLogs(false)}
          onClear={handleClearLogs}
        />
      )}
    </>
  )
}

// ─── DevicesPanel (main export) ───────────────────────────────────────────────

export default function DevicesPanel({ onBack }) {
  const [devices, setDevices] = useState([])
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(true)
  const [apkInfo, setApkInfo] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const pollRef = useRef(null)

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/devices', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setDevices(Array.isArray(data) ? data : [])
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    // Fetch devices + screens + APK info in parallel
    fetchDevices()

    fetch('/api/v1/screens', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setScreens(Array.isArray(data) ? data : []))
      .catch(() => {})

    fetch('/api/v1/apk-info')
      .then(r => r.json())
      .then(setApkInfo)
      .catch(() => {})

    // Poll every 30s
    pollRef.current = setInterval(fetchDevices, 30_000)
    return () => clearInterval(pollRef.current)
  }, [fetchDevices])

  const onlineCount = devices.filter(d => onlineStatus(d.last_seen) === 'online').length
  const apkUrl = apkInfo?.available
    ? `${window.location.origin}/download/screen-editor-player.apk`
    : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)', color: 'var(--ink)' }}>

      {/* Header */}
      <header style={{
        height: 56, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-ghost)',
        backgroundColor: 'var(--surface-lowest)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: '4px 2px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ChevronLeft size={18} />
            <span style={{ fontSize: 13 }}>Retour</span>
          </button>
          <span style={{ color: 'var(--border-ghost)', fontSize: 18, userSelect: 'none' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(145deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Tv size={14} color="white" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Appareils connectés</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {apkUrl && (
            <button
              onClick={() => setShowQr(true)}
              style={btnSecondaryStyle}
            >
              <QrCode size={14} style={{ marginRight: 6 }} />
              APK
            </button>
          )}
          <button
            onClick={() => { setLoading(true); fetchDevices() }}
            style={btnSecondaryStyle}
          >
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            Actualiser
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatChip icon={<Tv size={14} />} label="Total" value={devices.length} color="var(--steel)" />
          <StatChip icon={<Wifi size={14} />} label="En ligne" value={onlineCount} color="#10b981" />
          <StatChip icon={<WifiOff size={14} />} label="Hors ligne" value={devices.length - onlineCount} color="#ef4444" />
        </div>

        {/* APK info box */}
        {apkInfo?.available && (
          <div style={{
            marginBottom: 24,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(99,102,241,.3)',
            backgroundColor: 'rgba(99,102,241,.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <Monitor size={16} color="#818cf8" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                APK disponible — Screen Editor Player v{apkInfo.version || '1.0.0'}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                {apkUrl} · {apkInfo.sizeKb}KB
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowQr(true)} style={btnSecondarySmallStyle}>
                <QrCode size={12} style={{ marginRight: 4 }} />
                QR Code
              </button>
              <a href={apkUrl} download style={{ textDecoration: 'none' }}>
                <button style={btnPrimarySmallStyle}>
                  Télécharger
                </button>
              </a>
            </div>
          </div>
        )}

        {/* Device list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border-ghost)', borderTopColor: '#516076', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : devices.length === 0 ? (
          <EmptyDevices />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {devices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                screens={screens}
                onRefresh={fetchDevices}
                onDelete={fetchDevices}
              />
            ))}
          </div>
        )}
      </div>

      {/* QR Code modal */}
      {showQr && apkUrl && (
        <QrModal url={apkUrl} onClose={() => setShowQr(false)} />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 8,
      backgroundColor: 'var(--surface-low)',
      border: '1px solid var(--border-ghost)',
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}

function EmptyDevices() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Tv size={28} color="var(--ink-muted)" />
      </div>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Aucun appareil</h2>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 360 }}>
        Installez l'APK Screen Editor Player sur un appareil Android TV et configurez l'URL du serveur pour qu'il apparaisse ici.
      </p>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--ink-muted)',
  marginBottom: 4,
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border-ghost)',
  backgroundColor: 'var(--surface-low)',
  color: 'var(--ink)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const btnPrimaryStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '7px 14px',
  borderRadius: 8,
  fontSize: 13, fontWeight: 600,
  backgroundColor: '#6366f1',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
}

const btnSecondaryStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: 13,
  backgroundColor: 'var(--surface-low)',
  color: 'var(--ink-muted)',
  border: '1px solid var(--border-ghost)',
  cursor: 'pointer',
}

const btnSecondarySmallStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '5px 10px',
  borderRadius: 6,
  fontSize: 12,
  backgroundColor: 'var(--surface-high)',
  color: 'var(--ink-muted)',
  border: '1px solid var(--border-ghost)',
  cursor: 'pointer',
}

const btnPrimarySmallStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '5px 12px',
  borderRadius: 6,
  fontSize: 12, fontWeight: 600,
  backgroundColor: '#6366f1',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
}
