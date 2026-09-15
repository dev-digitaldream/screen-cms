import { Play } from 'lucide-react'
import React from 'react'
import { YoutubeRenderer } from './shared/PlaylistRenderers'

function YoutubeWidget({ config, size, display }) {
  const url = config.url || ''
  const isPlaylist = url.includes('list=')
  const listId = isPlaylist ? (url.match(/list=([^&]+)/)?.[1] || '') : ''
  const vidId = !isPlaylist ? (url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || '') : ''

  if (display) {
    return (
      <div className="w-full h-full overflow-hidden rounded-xl" style={{ background: '#000' }}>
        <YoutubeRenderer item={config} />
      </div>
    )
  }

  // Editor mode: thumbnail + label
  const thumbnailUrl = vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : ''

  return (
    <div className="w-full h-full flex items-center justify-center rounded-xl overflow-hidden select-none"
      style={{
        background: thumbnailUrl
          ? `url(${thumbnailUrl}) center/cover no-repeat`
          : 'rgba(153, 27, 27, 0.3)',
      }}>
      <div className="flex flex-col items-center gap-2"
        style={{ backgroundColor: 'rgba(0,0,0,.5)', padding: '12px 20px', borderRadius: 12 }}>
        <div style={{
          width: Math.min(64, size.w / 5),
          height: Math.min(64, size.w / 5),
          borderRadius: '50%',
          backgroundColor: 'rgba(239,68,68,.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Play size={Math.min(32, size.w / 8)} style={{ color: '#fca5a5', fill: '#fca5a5' }} />
        </div>
        <p style={{ fontSize: Math.max(10, Math.min(14, size.w / 20)), color: '#fca5a5', textAlign: 'center' }}>
          {url ? (isPlaylist ? 'Playlist YouTube' : 'Vidéo YouTube') : 'Configurez l\'URL'}
        </p>
      </div>
    </div>
  )
}

export default React.memo(YoutubeWidget)
