import { Film } from 'lucide-react'
import React from 'react'
import { VideoRenderer } from './shared/PlaylistRenderers'

function VideoWidget({ config, size, display }) {
  const videoUrl = config.videoUrl || ''

  // Display mode: play video
  if (display && videoUrl) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden" style={{ background: '#000' }}>
        <VideoRenderer item={config} />
      </div>
    )
  }

  // Editor mode: placeholder (or thumbnail if browser supports it)
  if (videoUrl) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ background: '#000' }}>
        <video
          src={videoUrl}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: config.fit || 'cover', display: 'block', opacity: 0.6 }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: Math.min(48, size.w / 5),
            height: Math.min(48, size.w / 5),
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Film size={Math.min(24, size.w / 10)} style={{ color: '#fff' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
      <Film size={Math.min(size.w / 4, size.h / 3)} style={{ color: '#a78bfa' }} />
      <p style={{ fontSize: Math.max(11, Math.min(16, size.w / 18)), color: '#c4b5fd', marginTop: 8 }}>
        Vidéo locale
      </p>
    </div>
  )
}

export default React.memo(VideoWidget)
