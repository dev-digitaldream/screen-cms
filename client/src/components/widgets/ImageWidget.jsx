import { Image } from 'lucide-react'
import React from 'react'
import { ImageRenderer } from './shared/PlaylistRenderers'

function ImageWidget({ config, size }) {
  if (config.imageUrl) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden">
        <ImageRenderer item={config} />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
      <Image size={Math.min(size.w / 4, size.h / 3)} style={{ color: '#22d3ee' }} />
      <p style={{ fontSize: Math.max(11, Math.min(16, size.w / 18)), color: '#67e8f9', marginTop: 8 }}>Image</p>
    </div>
  )
}

export default React.memo(ImageWidget)
