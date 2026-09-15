import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import React from 'react'

function buildQrContent(config) {
  switch (config.qrType || 'url') {
    case 'wifi':
      return `WIFI:S:${config.wifiSsid || ''};T:${config.wifiSecurity || 'WPA'};P:${config.wifiPassword || ''};;`
    case 'text':
      return config.qrText || ''
    default:
      return config.url || ''
  }
}

function QrCodeWidget({ config, size }) {
  const content = buildQrContent(config)
  const canvasRef = useRef(null)
  const qrSize = Math.min(size.w - 24, size.h - (config.label ? 50 : 24))
  const labelSize = Math.max(10, Math.min(16, size.h / 12))

  useEffect(() => {
    if (!canvasRef.current || !content) return
    QRCode.toCanvas(canvasRef.current, content, {
      width: Math.round(qrSize),
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(() => {})
  }, [content, qrSize])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden p-3"
      style={{ backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'pixelated' }} />
      </div>
      {config.label && (
        <p style={{ fontSize: labelSize, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
          {config.label}
        </p>
      )}
    </div>
  )
}

export default React.memo(QrCodeWidget)
