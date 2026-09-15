import { useEditorStore } from '@/stores/editorStore'
import { SCREEN_RESOLUTIONS } from '@/lib/constants'
import { Dropdown } from '@/components/ui/Dropdown'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Slider } from '@/components/ui/Slider'
import { MediaPickerField } from '@/components/ui/MediaLibrary'
import { Tv, Copy, ExternalLink, Download, Smartphone } from 'lucide-react'
import { useState, useEffect } from 'react'

const SECTION_STYLE = { borderBottom: '1px solid var(--surface-high)', paddingBottom: '1rem', marginBottom: '1rem' }
const LABEL_STYLE = { color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }

function ScreenConfig() {
  const store = useEditorStore()
  const config = store.screenConfig

  const resolutionOptions = Object.entries(SCREEN_RESOLUTIONS).map(([id, data]) => ({
    value: id,
    label: data.label,
  }))

  const themeOptions = [
    { value: 'dark', label: 'Sombre' },
    { value: 'light', label: 'Clair' },
  ]

  const fontOptions = [
    { value: 'system', label: 'Système' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Oswald', label: 'Oswald' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Barlow', label: 'Barlow' },
    { value: 'Space Grotesk', label: 'Space Grotesk' },
    { value: 'DM Sans', label: 'DM Sans' },
  ]

  const rotationOptions = [
    { value: '0', label: 'Normal (0°)' },
    { value: '90', label: 'Gauche (90°)' },
    { value: '180', label: 'Retourné (180°)' },
    { value: '270', label: 'Droite (270°)' },
  ]

  const animationOptions = [
    { value: 'none', label: 'Aucune' },
    { value: 'topographic', label: 'Topographique' },
    { value: 'particles', label: 'Particules' },
    { value: 'waves', label: 'Ondes' },
    { value: 'grid', label: 'Grille' },
  ]

  const handleUpdate = (changes) => {
    store.updateScreenConfig(changes)
  }

  return (
    <div className="space-y-4">
      {/* Identité */}
      <div style={SECTION_STYLE}>
        <h4 className="section-label mb-3">Identité</h4>
        <div className="space-y-2">
          <div>
            <label style={LABEL_STYLE}>Nom de l'écran</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Slug</label>
            <input
              type="text"
              value={config.slug}
              onChange={(e) => handleUpdate({ slug: e.target.value })}
              className="input-base font-mono"
            />
          </div>
        </div>
      </div>

      {/* Affichage */}
      <div style={SECTION_STYLE}>
        <h4 className="section-label mb-3">Affichage</h4>
        <div className="space-y-3">
          <div>
            <label className="section-label block mb-1">Résolution</label>
            <Dropdown
              value={config.resolution}
              onChange={(v) => handleUpdate({ resolution: v })}
              options={resolutionOptions}
            />
          </div>
          <div>
            <label className="section-label block mb-1">Rotation écran</label>
            <Dropdown
              value={config.rotation || '0'}
              onChange={(v) => handleUpdate({ rotation: v })}
              options={rotationOptions}
            />
            <p style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '4px' }}>
              Pour les écrans montés à l'envers ou orientés différemment
            </p>
          </div>
          <div>
            <label className="section-label block mb-1">Police de caractères</label>
            <Dropdown
              value={config.fontFamily || 'system'}
              onChange={(v) => handleUpdate({ fontFamily: v })}
              options={fontOptions}
            />
          </div>
        </div>
      </div>

      {/* Background type selector */}
      <div style={SECTION_STYLE}>
        <h4 className="section-label mb-3">Arrière-plan</h4>
        <div className="space-y-2">
          <div>
            <label className="section-label block mb-1.5">Type de fond</label>
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {[
                { value: 'color', label: 'Couleur' },
                { value: 'gradient', label: 'Gradient' },
                { value: 'image', label: 'Image' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleUpdate({ backgroundType: opt.value })}
                  className="py-1.5 rounded text-[11px] font-medium transition-all"
                  style={
                    (config.backgroundType || 'color') === opt.value
                      ? { backgroundColor: 'var(--steel)', color: '#ffffff' }
                      : { backgroundColor: 'var(--surface-highest)', color: 'var(--ink-muted)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          {(!config.backgroundType || config.backgroundType === 'color') && (
            <ColorPicker
              label="Couleur de fond"
              value={config.backgroundColor}
              onChange={(v) => handleUpdate({ backgroundColor: v })}
            />
          )}

          {/* Gradient */}
          {config.backgroundType === 'gradient' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <ColorPicker label="Couleur 1" value={config.gradientColor1 || '#0c0f0f'}
                    onChange={v => handleUpdate({ gradientColor1: v })} />
                </div>
                <div className="flex-1">
                  <ColorPicker label="Couleur 2" value={config.gradientColor2 || '#1a2030'}
                    onChange={v => handleUpdate({ gradientColor2: v })} />
                </div>
              </div>
              <div>
                <label className="section-label block mb-1">Direction</label>
                <select value={config.gradientDir || '135deg'} onChange={e => handleUpdate({ gradientDir: e.target.value })}
                  className="input-base w-full text-[12px]">
                  <option value="135deg">Diagonal ↘</option>
                  <option value="180deg">Vertical ↓</option>
                  <option value="90deg">Horizontal →</option>
                  <option value="0deg">Vertical ↑</option>
                  <option value="45deg">Diagonal ↗</option>
                </select>
              </div>
              {/* Preview */}
              <div className="rounded h-8 w-full"
                style={{ background: `linear-gradient(${config.gradientDir || '135deg'}, ${config.gradientColor1 || '#0c0f0f'}, ${config.gradientColor2 || '#1a2030'})` }} />
            </div>
          )}

          {/* Image */}
          {config.backgroundType === 'image' && (
            <div className="space-y-2">
              <MediaPickerField
                label="Image de fond"
                value={config.backgroundImage}
                onChange={v => handleUpdate({ backgroundImage: v })}
                accept="image"
              />
              <div>
                <label className="section-label block mb-1">Ajustement</label>
                <select value={config.backgroundFit || 'cover'} onChange={e => handleUpdate({ backgroundFit: e.target.value })}
                  className="input-base w-full text-[12px]">
                  <option value="cover">Cover (remplir)</option>
                  <option value="contain">Contain (tout voir)</option>
                  <option value="fill">Étirer</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="section-label block mb-1">Animation de fond</label>
            <Dropdown
              value={config.backgroundAnimation || 'none'}
              onChange={(v) => handleUpdate({ backgroundAnimation: v })}
              options={animationOptions}
            />
          </div>
          <div>
            <label className="section-label block mb-1">Thème TV</label>
            <Dropdown
              value={config.theme}
              onChange={(v) => handleUpdate({ theme: v })}
              options={themeOptions}
            />
          </div>
          <div>
            <label className="section-label block mb-1">Fuseau horaire</label>
            <input
              type="text"
              value={config.timezone}
              onChange={(e) => handleUpdate({ timezone: e.target.value })}
              className="input-base w-full"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div style={SECTION_STYLE}>
        <h4 className="section-label mb-3">Branding</h4>
        <div className="space-y-2">
          <div>
            <label style={LABEL_STYLE}>Nom de l'entreprise</label>
            <input
              type="text"
              value={config.brandName}
              onChange={(e) => handleUpdate({ brandName: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Couleur accent</label>
            <ColorPicker
              value={config.accentColor}
              onChange={(v) => handleUpdate({ accentColor: v })}
            />
          </div>
        </div>
      </div>

      {/* Rafraîchissement */}
      <div style={SECTION_STYLE}>
        <h4 className="section-label mb-3">Refresh</h4>
        <Slider
          label="Intervalle (sec)"
          value={config.refreshInterval}
          onChange={(v) => handleUpdate({ refreshInterval: v })}
          min={30}
          max={1800}
          step={30}
        />
      </div>

      {/* Android TV */}
      <AndroidTvSection slug={config.slug} displayToken={store.displayToken} />
    </div>
  )
}

function AndroidTvSection({ slug, displayToken }) {
  const [copied, setCopied] = useState(false)
  const [apkInfo, setApkInfo] = useState(null)
  
  // Safety check for window object
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
  const host = typeof window !== 'undefined' ? window.location.host : 'your-domain.com'
  const baseUrl = `${protocol}//${host}/display/${slug}`
  const displayUrl = displayToken ? `${baseUrl}?t=${displayToken}` : baseUrl

  useEffect(() => {
    fetch('/api/v1/apk-info')
      .then(r => r.json())
      .then(data => setApkInfo(data))
      .catch(() => setApkInfo({ available: false }))
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(displayUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const apkDownloadUrl = `${protocol}//${host}/download/screen-editor-player.apk`

  return (
    <div className="space-y-3">
      <h4 className="section-label flex items-center gap-1.5">
        <Tv size={11} /> Android TV
      </h4>

      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
        URL à charger sur l'écran Android :
      </p>
      <div className="rounded-lg px-3 py-2 font-mono text-[10px] break-all"
        style={{ backgroundColor: 'var(--surface-low)', color: 'var(--steel)' }}
      >
        {displayUrl}
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
          <Copy size={11} /> {copied ? 'Copié !' : 'Copier'}
        </button>
        <button onClick={() => window.open(displayUrl, '_blank')} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
          <ExternalLink size={11} /> Aperçu
        </button>
      </div>

      <div className="pt-2" style={{ borderTop: '1px solid var(--surface-high)' }}>
        <p className="text-[11px] mb-2 flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}>
          <Smartphone size={11} /> Screen Editor Player (app Android)
        </p>
        {apkInfo === null ? (
          <div className="text-[10px] italic" style={{ color: 'var(--ink-ghost)' }}>Vérification…</div>
        ) : apkInfo.available ? (
          <a
            href={apkDownloadUrl}
            download="screen-editor-player.apk"
            className="flex items-center justify-center gap-1.5 w-full btn-secondary text-xs py-1.5"
            style={{ color: '#059669' }}
          >
            <Download size={11} />
            Télécharger l'APK ({apkInfo.sizeKb} ko)
          </a>
        ) : (
          <div className="text-[10px] italic leading-relaxed" style={{ color: 'var(--ink-ghost)' }}>
            APK non disponible. Exécutez <code className="font-mono px-1 rounded" style={{ backgroundColor: 'var(--surface-high)' }}>./build-android.sh</code> pour le générer.
          </div>
        )}
      </div>
    </div>
  )
}

export default ScreenConfig
