import { Globe } from 'lucide-react'
import React from 'react'
import { IframeRenderer } from './shared/PlaylistRenderers'

function IframeWidget({ config, size, display }) {
  const rawUrl = config.url || ''

  if (display && rawUrl) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden" style={{ background: config.background || '#fff' }}>
        <IframeRenderer item={config} size={size} />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
      <Globe size={Math.min(size.w / 4, size.h / 3)} style={{ color: '#38bdf8' }} />
      <p style={{ fontSize: Math.max(11, Math.min(16, size.w / 18)), color: '#7dd3fc', marginTop: 8 }}>
        {rawUrl ? (config.title || 'Page Web') : 'Configurez l\'URL'}
      </p>
      {rawUrl && (
        <p style={{ fontSize: Math.max(9, Math.min(12, size.w / 24)), color: 'rgba(125,211,252,.4)', marginTop: 4, maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {rawUrl}
        </p>
      )}
    </div>
  )
}

export default React.memo(IframeWidget)
