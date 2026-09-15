import { X } from 'lucide-react'

const SECTIONS = [
  {
    emoji: '🖥️',
    title: 'Le canvas — votre mise en page',
    color: '#6366f1',
    content: `Le canvas est la zone centrale qui représente votre écran TV (1920×1080 px). Vous construisez votre mise en page en y plaçant des blocs appelés "widgets" — chacun occupe une zone précise de l'écran.`,
    tips: [
      'Glissez un widget depuis le panneau gauche pour l\'ajouter',
      'Cliquez sur un widget pour le sélectionner et modifier ses réglages',
      'Faites glisser les coins pour redimensionner',
      'Ctrl+Z pour annuler, Ctrl+S pour sauvegarder',
    ],
  },
  {
    emoji: '🧩',
    title: 'Les widgets — les blocs de contenu',
    color: '#10b981',
    content: `Chaque widget affiche un type de contenu dans une zone de l'écran. Ils se mettent à jour automatiquement (météo, actualités, horloge…).`,
    items: [
      { icon: '🕐', label: 'Horloge', desc: 'Heure et date en temps réel' },
      { icon: '🌤️', label: 'Météo', desc: 'Température et prévisions Open-Meteo' },
      { icon: '📰', label: 'Actualités RSS', desc: 'Flux d\'articles depuis une URL RSS' },
      { icon: '📊', label: 'KPI', desc: 'Indicateur chiffré (chiffre d\'affaires, stock…)' },
      { icon: '▶️', label: 'YouTube', desc: 'Vidéo YouTube dans une zone du layout' },
      { icon: '🖼️', label: 'Image / Logo', desc: 'Fichier image depuis la bibliothèque' },
      { icon: '💬', label: 'Texte', desc: 'Message libre, titre, annonce' },
      { icon: '📺', label: 'Google Slides', desc: 'Présentation intégrée' },
    ],
  },
  {
    emoji: '🎬',
    title: 'La timeline — contenu plein écran en rotation',
    color: '#f59e0b',
    content: `La timeline est un système de diffusion qui prend le contrôle de TOUT l'écran et fait défiler du contenu séquentiellement, comme une playlist TV.`,
    detail: `Exemple : 2 min de KPIs et météo → 5 min de vidéo YouTube → 30 s d'image promotionnelle → recommence.`,
    tips: [
      'Activez la timeline via la barre en bas de l\'éditeur',
      'Ajoutez des slots : YouTube, Slides, Image, Vidéo, Diaporama, Urgence',
      'Chaque slot a une durée configurable',
      'La programmation horaire permet d\'activer un slot seulement certains jours / plages horaires',
    ],
  },
  {
    emoji: '📺',
    title: 'YouTube : widget ou timeline ?',
    color: '#ef4444',
    isComparison: true,
    left: {
      label: 'Widget YouTube (canvas)',
      desc: 'La vidéo joue dans une ZONE de votre layout, à côté d\'autres widgets (horloge, météo…). Idéal pour une ambiance vidéo en arrière-plan.',
    },
    right: {
      label: 'Slot YouTube (timeline)',
      desc: 'La vidéo prend tout l\'ÉCRAN pendant un temps défini, puis passe au slot suivant. Idéal pour de la rotation de contenu.',
    },
  },
  {
    emoji: '📡',
    title: 'Afficher sur un écran TV',
    color: '#06b6d4',
    content: `Votre mise en page est accessible via une URL publique. Il suffit de charger cette URL sur n'importe quel écran connecté à internet.`,
    tips: [
      'Cliquez sur l\'icône 📺 (Android TV) dans la barre du haut pour voir l\'URL',
      'Sur Android TV : utilisez Fully Kiosk Browser ou tout navigateur web',
      'Sur un PC / Raspberry Pi : chargez l\'URL en plein écran (F11)',
      'La page se rafraîchit automatiquement pour afficher les modifications',
    ],
  },
]

export function HelpModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(5,7,8,.65)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: 640,
          maxWidth: '95vw',
          maxHeight: '92vh',
          backgroundColor: '#111827',
          border: '1px solid rgba(81,96,118,.25)',
          boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(81,96,118,.2)' }}>
          <div>
            <h2 className="text-[17px] font-bold" style={{ color: '#e4e9ea' }}>
              Guide rapide — Screen Editor
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
              Comment fonctionne l'éditeur d'affichage dynamique
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{ color: '#6b7280', backgroundColor: 'rgba(255,255,255,.05)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.1)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.05)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {SECTIONS.map((section, i) => (
            <Section key={i} section={section} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end"
          style={{ borderTop: '1px solid rgba(81,96,118,.15)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={{ backgroundColor: '#6366f1', color: '#fff' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#4f46e5' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#6366f1' }}
          >
            C'est compris, allons-y !
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ section }) {
  const { emoji, title, color, content, tips, items, detail, isComparison, left, right } = section

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,.06)', backgroundColor: '#1a2030' }}>
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <h3 className="text-[13px] font-bold" style={{ color: '#e5e7eb' }}>{title}</h3>
        <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      </div>

      <div className="p-4 space-y-3">
        {content && (
          <p className="text-[13px] leading-relaxed" style={{ color: '#9ca3af' }}>{content}</p>
        )}

        {detail && (
          <div className="rounded-lg px-3 py-2.5 text-[12px] italic leading-relaxed"
            style={{ backgroundColor: 'rgba(99,102,241,.08)', color: '#a5b4fc', borderLeft: `3px solid ${color}` }}>
            {detail}
          </div>
        )}

        {tips && (
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: '#9ca3af' }}>
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: color + '22', color }}>
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        )}

        {items && (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2"
                style={{ backgroundColor: 'rgba(255,255,255,.04)' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: '#d1d5db' }}>{item.label}</p>
                  <p className="text-[11px] leading-snug mt-0.5" style={{ color: '#6b7280' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isComparison && (
          <div className="grid grid-cols-2 gap-3">
            <CompareCard label={left.label} desc={left.desc} color="#6366f1" tag="ZONE" />
            <CompareCard label={right.label} desc={right.desc} color="#f59e0b" tag="PLEIN ÉCRAN" />
          </div>
        )}
      </div>
    </div>
  )
}

function CompareCard({ label, desc, color, tag }) {
  return (
    <div className="rounded-lg p-3 space-y-2"
      style={{ backgroundColor: color + '10', border: `1px solid ${color}33` }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold" style={{ color }}>{label}</p>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: color + '20', color }}>{tag}</span>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>{desc}</p>
    </div>
  )
}
