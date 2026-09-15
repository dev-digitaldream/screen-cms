import { Images } from 'lucide-react'
import React from 'react'
import { SlideshowRenderer } from './shared/PlaylistRenderers'

function SlideshowWidget({ config, size, display }) {
  const images = config.images || []

  if (display && images.length > 0) {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-xl" style={{ background: '#000' }}>
        <SlideshowRenderer item={config} size={size} />
      </div>
    )
  }

  // Editor placeholder
  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
      <Images size={Math.min(size.w / 4, size.h / 3)} style={{ color: '#a78bfa' }} />
      <p style={{ fontSize: Math.max(11, Math.min(16, size.w / 18)), color: '#c4b5fd', marginTop: 8 }}>
        {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''}` : 'Diaporama'}
      </p>
    </div>
  )
}

export default React.memo(SlideshowWidget)
