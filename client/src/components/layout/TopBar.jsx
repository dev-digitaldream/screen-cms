import { RotateCcw, Redo2, Save, Download, Eye, Monitor, Settings2, LogOut, Tv, ChevronLeft, HelpCircle } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useScreenAPI } from '@/hooks/useScreenAPI'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuth } from '@/hooks/useAuth.jsx'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Tooltip } from '@/components/ui/Tooltip'
import { HelpModal } from '@/components/ui/HelpModal'
import { exportToJSON, downloadJSON } from '@/lib/exportLayout'
import { useState, useCallback } from 'react'

function TopBar({ onHome }) {
  const screenConfig = useEditorStore(s => s.screenConfig)
  const updateScreenConfig = useEditorStore(s => s.updateScreenConfig)
  const configPanelOpen = useEditorStore(s => s.configPanelOpen)
  const setConfigPanelOpen = useEditorStore(s => s.setConfigPanelOpen)
  const temporal = useEditorStore.temporal
  const { saveLayout, loading: saving } = useScreenAPI()
  const { user, logout } = useAuth()
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | 'error' | null
  const [showDisplayUrl, setShowDisplayUrl] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const onAutoSaved = useCallback(() => {
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 1500)
  }, [])
  const onAutoError = useCallback(() => {
    setSaveStatus('error')
    setTimeout(() => setSaveStatus(null), 3000)
  }, [])
  useAutoSave(onAutoSaved, onAutoError)

  const handleUndo = () => temporal?.getState()?.undo()
  const handleRedo = () => temporal?.getState()?.redo()

  const handleSave = async () => {
    try {
      await saveLayout()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const handleExport = () => {
    const store = useEditorStore.getState()
    const json = exportToJSON(store)
    downloadJSON(json, `layout-${screenConfig.slug}.json`)
  }

  const displayToken = useEditorStore(s => s.displayToken)
  const displayUrl = displayToken ? `/display/${screenConfig.slug}?t=${displayToken}` : `/display/${screenConfig.slug}`
  const fullDisplayUrl = `${window.location.protocol}//${window.location.host}${displayUrl}`

  return (
    <header
      className="h-11 flex items-center justify-between gap-4 select-none px-4"
      style={{ backgroundColor: 'var(--surface-lowest)', boxShadow: '0 1px 0 var(--border-ghost)' }}
    >
      {/* Left — Branding + slug */}
      <div className="flex items-center gap-3 min-w-0">
        {onHome && (
          <Tooltip content="Mes écrans">
            <button
              onClick={onHome}
              className="btn-ghost flex items-center gap-1 text-[12px]"
              style={{ color: 'var(--ink-muted)' }}
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:block">Écrans</span>
            </button>
          </Tooltip>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Charcoal logo mark — "milled metal" gradient */}
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(145deg, #5f5e5e, #535252)' }}
          >
            <Monitor size={12} className="text-white" />
          </div>
          <span className="font-semibold text-[13px] hidden sm:block" style={{ color: 'var(--ink)' }}>
            SignagePro
          </span>
        </div>

        <div className="h-4 w-px hidden sm:block" style={{ backgroundColor: 'var(--surface-highest)' }} />

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={screenConfig.name}
            onChange={(e) => updateScreenConfig({ name: e.target.value })}
            className="text-[13px] font-medium bg-transparent border-none outline-none min-w-0 w-36 rounded px-1 -mx-1 transition-colors"
            style={{ color: 'var(--ink)' }}
            placeholder="Nom de l'écran"
            onFocus={e => { e.target.style.backgroundColor = '#f2f4f4' }}
            onBlur={e => { e.target.style.backgroundColor = '' }}
          />
          {/* steel blue chip for slug */}
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded hidden md:block"
            style={{ color: 'var(--steel)', backgroundColor: 'var(--steel-light)' }}
          >
            /{screenConfig.slug}
          </span>
        </div>
      </div>

      {/* Center — History + Save */}
      <div className="flex items-center gap-0.5">
        <Tooltip content="Annuler (Ctrl+Z)">
          <button onClick={handleUndo} className="btn-ghost">
            <RotateCcw size={15} />
          </button>
        </Tooltip>
        <Tooltip content="Refaire (Ctrl+Y)">
          <button onClick={handleRedo} className="btn-ghost">
            <Redo2 size={15} />
          </button>
        </Tooltip>

        <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--surface-highest)' }} />

        <Tooltip content="Sauvegarder (Ctrl+S)">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-ghost"
            style={
              saveStatus === 'saved' ? { color: '#059669' } :
              saveStatus === 'error' ? { color: '#dc2626' } : {}
            }
          >
            <Save size={15} />
          </button>
        </Tooltip>
        {saveStatus === 'saved' && (
          <span className="text-[10px] font-mono" style={{ color: '#059669' }}>sauvegardé</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-[10px] font-mono" style={{ color: '#dc2626' }}>erreur</span>
        )}

        <Tooltip content="Exporter JSON">
          <button onClick={handleExport} className="btn-ghost">
            <Download size={15} />
          </button>
        </Tooltip>
      </div>

      {/* Right */}
      <div className="flex items-center gap-0.5">
        {/* Android TV URL */}
        <div className="relative">
          <Tooltip content="URL d'affichage Android TV">
            <button
              onClick={() => setShowDisplayUrl(!showDisplayUrl)}
              className="btn-ghost"
              style={showDisplayUrl ? { color: 'var(--steel)', backgroundColor: 'var(--steel-light)' } : {}}
            >
              <Tv size={15} />
            </button>
          </Tooltip>

          {showDisplayUrl && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-lg p-4 z-50"
              style={{ backgroundColor: 'var(--surface-lowest)', boxShadow: '0 8px 24px rgba(45,52,53,.08), 0 4px 8px rgba(45,52,53,.04)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--steel-light)' }}
                >
                  <Tv size={13} style={{ color: 'var(--steel)' }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>URL d'affichage TV</p>
                  <p className="text-[10px]" style={{ color: 'var(--ink-subtle)' }}>Chargez cette URL sur votre Android TV</p>
                </div>
              </div>
              <div
                className="rounded px-3 py-2 font-mono text-[11px] break-all mb-3"
                style={{ backgroundColor: 'var(--surface-low)', color: 'var(--steel)' }}
              >
                {fullDisplayUrl}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(fullDisplayUrl)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Copier l'URL
                </button>
                <button
                  onClick={() => window.open(displayUrl, '_blank')}
                  className="btn-primary flex-1 justify-center"
                >
                  Aperçu
                </button>
              </div>
              <p className="text-[10px] mt-3" style={{ color: 'var(--ink-ghost)' }}>
                Sur Android TV : Fully Kiosk Browser ou WebView. Auto-refresh toutes les {screenConfig.refreshInterval || 300}s.
              </p>
            </div>
          )}
        </div>

        <Tooltip content="Aperçu plein écran">
          <button onClick={() => window.open(displayUrl, '_blank')} className="btn-ghost">
            <Eye size={15} />
          </button>
        </Tooltip>

        <Tooltip content="Aide — comment ça marche ?">
          <button onClick={() => setShowHelp(true)} className="btn-ghost" style={{ color: 'var(--ink-muted)' }}>
            <HelpCircle size={15} />
          </button>
        </Tooltip>

        <ThemeToggle />

        <div className="h-4 w-px mx-0.5" style={{ backgroundColor: 'var(--surface-highest)' }} />

        <Tooltip content="Panneau de configuration">
          <button
            onClick={() => setConfigPanelOpen(!configPanelOpen)}
            className="btn-ghost"
            style={configPanelOpen ? { color: 'var(--steel)', backgroundColor: 'var(--steel-light)' } : {}}
          >
            <Settings2 size={15} />
          </button>
        </Tooltip>

        {user && (
          <>
            <div className="h-4 w-px mx-0.5" style={{ backgroundColor: 'var(--surface-highest)' }} />
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded hidden sm:block"
              style={{ backgroundColor: user.role === 'admin' ? 'rgba(99,102,241,.12)' : 'var(--surface-high)', color: user.role === 'admin' ? '#6366f1' : 'var(--ink-muted)' }}>
              {user.username}
            </span>
            <Tooltip content="Se déconnecter">
              <button onClick={logout} className="btn-ghost" style={{ color: 'var(--ink-subtle)' }}>
                <LogOut size={15} />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      {showDisplayUrl && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDisplayUrl(false)} />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </header>
  )
}

export default TopBar
