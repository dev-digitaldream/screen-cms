'use strict'

const express = require('express')
const path = require('path')
const fs = require('fs')
const router = express.Router()

const isDev = process.env.NODE_ENV !== 'production'
const clientDist = path.join(__dirname, '../../../client/dist')
// Dev: Vite port — auto-detected or overridden via VITE_PORT env
const VITE_PORT = process.env.VITE_PORT || 5174

// GET /display/:slug — React WYSIWYG display
router.get('/:slug', (req, res) => {
  const slug = req.params.slug
  // Validate slug (alphanumeric + hyphens only)
  if (!/^[a-z0-9_-]+$/i.test(slug)) return res.status(400).send('Invalid slug')

  // Token check — skip in dev for convenience
  if (!isDev) {
    const { getDb } = require('../db/index')
    const row = getDb().prepare('SELECT display_token FROM layouts WHERE slug = ?').get(slug)
    if (!row) return res.status(404).send('<h1 style="font-family:monospace;color:#555;text-align:center;margin-top:20vh">404 — Screen not found</h1>')
    if (!row.display_token || req.query.t !== row.display_token) {
      return res.status(401).send('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Access denied</title><style>body{background:#000;color:#333;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}</style></head><body><div><div style="font-size:48px;margin-bottom:16px">🔒</div><div>Access denied</div></div></body></html>')
    }
  }

  const token = req.query.t || ''

  res.removeHeader('Content-Security-Policy')
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' http://localhost:${VITE_PORT} https://www.youtube.com https://s.ytimg.com`,
    `style-src 'self' 'unsafe-inline' http://localhost:${VITE_PORT} https://fonts.googleapis.com`,
    `font-src https://fonts.gstatic.com http://localhost:${VITE_PORT}`,
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://docs.google.com https://slides.google.com https://lookerstudio.google.com https://chart.googleapis.com https:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob: https:",
    `connect-src 'self' http://localhost:${VITE_PORT} ws://localhost:${VITE_PORT} https://api.open-meteo.com https:`,
    "worker-src 'self' blob:",
  ].join('; '))
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')

  if (isDev) {
    // Dev mode: load from Vite dev server with HMR
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1920" />
  <title>Screen · ${slug}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#000;font-family:Inter,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}#display-root{width:100%;height:100%}</style>
  <script>window.__SLUG__ = ${JSON.stringify(slug)}; window.__TOKEN__ = ${JSON.stringify(token)}</script>
  <script type="module" src="http://localhost:${VITE_PORT}/@vite/client"></script>
  <script type="module">
    import RefreshRuntime from 'http://localhost:${VITE_PORT}/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
  <script type="module" src="http://localhost:${VITE_PORT}/src/display/main.jsx"></script>
</head>
<body>
  <div id="display-root"></div>
</body>
</html>`)
  } else {
    // Prod mode: serve built display.html with slug injected
    const htmlPath = path.join(clientDist, 'display.html')
    if (!fs.existsSync(htmlPath)) {
      return res.status(503).send('<h1>Display not built. Run: npm run build</h1>')
    }
    const html = fs.readFileSync(htmlPath, 'utf8')
      .replace('</head>', `<script>window.__SLUG__ = ${JSON.stringify(slug)}; window.__TOKEN__ = ${JSON.stringify(token)}</script></head>`)
    res.send(html)
  }
})

// GET /display/:slug/json — raw layout JSON for integrations
const { getDb } = require('../db/index')
router.get('/:slug/json', (req, res) => {
  try {
    const db = getDb()
    const row = db.prepare('SELECT layout_json, updated_at FROM layouts WHERE slug = ?').get(req.params.slug)
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json({ ...JSON.parse(row.layout_json), _updatedAt: row.updated_at })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
