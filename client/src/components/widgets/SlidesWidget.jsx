import { Presentation } from 'lucide-react'
import React from 'react'
import { SlidesRenderer } from './shared/PlaylistRenderers'

function SlidesWidget({ config, size, display }) {
  const embedUrl = config.embedUrl || ''

  // Display mode: use shared renderer
  if (display && embedUrl) {
    return (
      <div className="w-full h-full overflow-hidden rounded-xl" style={{ background: '#000' }}>
        <SlidesRenderer item={config} />
      </div>
    )
  }

  // Editor mode: placeholder
  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden select-none"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
      <Presentation size={Math.min(size.w / 4, size.h / 3)} style={{ color: '#fb923c', marginBottom: 8 }} />
      <p style={{ fontSize: Math.max(11, Math.min(16, size.w / 18)), color: '#fdba74', textAlign: 'center', padding: '0 8px' }}>
        Google Slides
      </p>
      {embedUrl && (
        <p style={{ fontSize: Math.max(9, Math.min(12, size.w / 24)), color: 'rgba(253,186,116,.4)', marginTop: 8, textAlign: 'center', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
          {embedUrl}
        </p>
      )}
    </div>
  )
}

export default React.memo(SlidesWidget)
