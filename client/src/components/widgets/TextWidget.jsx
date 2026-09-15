import React from 'react'
import { TextRenderer } from './shared/PlaylistRenderers'

function TextWidget({ config, size }) {
  // Map legacy TextWidget config to TextRenderer shape
  const item = {
    content: config.content || 'Texte',
    eyebrow: config.eyebrow,
    subtitle: config.subtitle,
    textColor: config.textColor || '#FFFFFF',
    backgroundColor: config.backgroundColor || 'transparent',
    accentColor: config.accentColor,
    subtitleColor: config.subtitleColor,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    fontWeight: config.fontWeight,
    lineHeight: config.lineHeight,
    textAlign: config.textAlign || 'center',
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <TextRenderer item={item} size={size} />
    </div>
  )
}

export default React.memo(TextWidget)
