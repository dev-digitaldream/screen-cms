import { Building2 } from 'lucide-react'
import React from 'react'

function LogoWidget({ config, size }) {
  const nameSize = Math.max(12, Math.min(size.w / 8, size.h / 5))
  // When an image is loaded: transparent by default unless user sets a background
  const bgColor = config.backgroundColor || (config.imageUrl ? 'transparent' : 'rgba(255,255,255,.03)')
  const border = config.imageUrl && !config.showBorder ? 'none' : '1px solid rgba(255,255,255,.08)'

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden select-none"
      style={{ backgroundColor: bgColor, border }}>
      {config.imageUrl ? (
        <img src={config.imageUrl} alt="Logo" style={{ maxWidth: '90%', maxHeight: '85%', objectFit: 'contain' }} />
      ) : (
        <>
          <Building2 size={Math.min(size.w / 3, size.h / 3)} style={{ color: '#818cf8', marginBottom: nameSize * 0.3 }} />
          {config.showName && (
            <span style={{ fontSize: nameSize, fontWeight: 600, color: '#a5b4fc', textAlign: 'center', padding: '0 8px' }}>
              {config.companyName || 'Entreprise'}
            </span>
          )}
        </>
      )}
    </div>
  )
}

export default React.memo(LogoWidget)
