'use strict'

const path = require('path')
const fs = require('fs')
const express = require('express')
const session = require('express-session')
const helmet = require('helmet')
const compression = require('compression')
const cors = require('cors')

const { initDb } = require('./src/db/index')
const { requireAuth, requireAdmin } = require('./src/middleware/auth')
const { startPoller } = require('./src/services/dataFetcher')

// Init DB
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
initDb(DATA_DIR)
startPoller()

const app = express()

if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1)
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.youtube.com', 'https://s.ytimg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://docs.google.com', 'https://slides.google.com', 'https://lookerstudio.google.com', 'https:'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://api.open-meteo.com', 'https://query1.finance.yahoo.com', 'https://chart.googleapis.com', 'https:'],
    },
  },
}))

// CORS (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }))
}

app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Persistent session store backed by SQLite (survives container restarts)
const SqliteStore = require('better-sqlite3-session-store')(session)
const sessionDb = new (require('better-sqlite3'))(path.join(DATA_DIR, 'sessions.sqlite'))
app.use(session({
  store: new SqliteStore({
    client: sessionDb,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 },
  }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production-please',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8h
  },
}))

// ── Static files ──────────────────────────────────────────────────────────

// Serve uploaded files (public — TV displays load images directly)
const uploadsDir = path.join(DATA_DIR, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// APK downloads (public — Android TV devices download the player app)
const downloadsDir = path.join(DATA_DIR, 'downloads')
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true })
app.use('/download', express.static(downloadsDir, { dotfiles: 'deny' }))

// Endpoint to check if APK is available (used by Android OTA worker)
app.get('/api/v1/apk-info', (req, res) => {
  const apkPath  = path.join(downloadsDir, 'screen-editor-player.apk')
  const metaPath = path.join(downloadsDir, 'screen-editor-player.json')
  if (fs.existsSync(apkPath)) {
    const stat = fs.statSync(apkPath)
    // Load optional metadata file for versionCode
    let meta = {}
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) } catch {}
    }
    res.json({
      available: true,
      url: '/download/screen-editor-player.apk',
      versionCode: meta.versionCode || 1,
      versionName: meta.versionName || '1.0.0',
      sizeKb: Math.round(stat.size / 1024),
      updatedAt: stat.mtime,
    })
  } else {
    res.json({ available: false })
  }
})

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
}

// ── API routes ────────────────────────────────────────────────────────────

// Auth (public)
app.use('/api/v1/auth', require('./src/routes/auth'))

// RSS proxy (public — display pages use it)
app.use('/api/v1/rss', require('./src/routes/rss'))

// Public screen read — needed by display pages (token required in production)
app.get('/api/v1/screens/:slug', (req, res) => {
  try {
    const { getDb } = require('./src/db/index')
    const db = getDb()
    const row = db.prepare('SELECT layout_json, display_token FROM layouts WHERE slug = ?').get(req.params.slug)
    if (!row) return res.status(404).json({ error: 'Not found' })
    // Authenticated CMS users bypass the token check
    const isAuth = !!req.session?.userId
    if (!isAuth && process.env.NODE_ENV === 'production' && row.display_token && req.query.t !== row.display_token) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    res.json(JSON.parse(row.layout_json))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Lightweight config hash — APK polls this every 60s to detect changes without full heartbeat
app.get('/api/v1/screens/:slug/config-hash', (req, res) => {
  try {
    const { getDb } = require('./src/db/index')
    const db = getDb()
    const row = db.prepare('SELECT layout_json, updated_at FROM layouts WHERE slug = ?').get(req.params.slug)
    if (!row) return res.status(404).json({ error: 'Not found' })
    const isAuth = !!req.session?.userId
    const layout = JSON.parse(row.layout_json)
    if (!isAuth && process.env.NODE_ENV === 'production' && layout.displayToken && req.query.t !== layout.displayToken) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    const sc = layout.screenConfig || {}
    // Hash = updatedAt + key config fields that matter for the device
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify({
        u: row.updated_at,
        r: sc.rotation,
        s: sc.scheduleEnabled,
        sd: sc.scheduleDays,
        ss: sc.scheduleStart,
        se: sc.scheduleEnd,
        sm: sc.standbyMessage,
      }))
      .digest('hex')
      .slice(0, 8)
    res.json({ hash, slug: req.params.slug })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Screens CRUD (protected — write operations)
app.use('/api/v1/screens', requireAuth, require('./src/routes/screens'))

// Devices (APK registration public, management protected)
app.use('/api/v1/devices', require('./src/routes/devices'))

// Uploads (protected)
app.use('/api/v1/uploads', requireAuth, require('./src/routes/uploads')(DATA_DIR))

// APK upload (admin only — stores in /downloads for OTA distribution)
{
  const multer = require('multer')
  const apkUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, downloadsDir),
      filename: (req, file, cb) => cb(null, 'screen-editor-player.apk'),
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (req, file, cb) => {
      if (file.originalname.endsWith('.apk') || file.mimetype === 'application/vnd.android.package-archive') {
        cb(null, true)
      } else {
        cb(new Error('APK files only'))
      }
    },
  })
  app.post('/api/v1/apk-upload', requireAdmin, apkUpload.single('apk'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    // Write optional metadata
    const meta = { versionCode: parseInt(req.body.versionCode) || 1, versionName: req.body.versionName || '1.0.0' }
    fs.writeFileSync(path.join(downloadsDir, 'screen-editor-player.json'), JSON.stringify(meta))
    res.json({ ok: true, size: req.file.size, meta })
  })
}

// Yahoo Finance proxy (avoids CORS on client-side)
// Uses crumb-based auth: first fetch crumb cookie, then query with it
let yahooCrumb = null
let yahooCookie = null
let yahooCrumbTime = 0

async function getYahooCrumb() {
  if (yahooCrumb && Date.now() - yahooCrumbTime < 3600_000) return { crumb: yahooCrumb, cookie: yahooCookie }
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  // Step 1: get consent cookie
  const r1 = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': ua }, redirect: 'manual', signal: AbortSignal.timeout(5000) })
  const setCookie = r1.headers.get('set-cookie') || ''
  const cookie = setCookie.split(';')[0] || ''
  // Step 2: get crumb
  const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': ua, Cookie: cookie }, signal: AbortSignal.timeout(5000),
  })
  const crumb = await r2.text()
  yahooCrumb = crumb; yahooCookie = cookie; yahooCrumbTime = Date.now()
  return { crumb, cookie }
}

app.get('/api/v1/yahoo-quote', async (req, res) => {
  const symbols = req.query.symbols
  if (!symbols) return res.status(400).json({ error: 'symbols required' })
  try {
    const { crumb, cookie } = await getYahooCrumb()
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    const resp = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&crumb=${encodeURIComponent(crumb)}`,
      { headers: { 'User-Agent': ua, Cookie: cookie }, signal: AbortSignal.timeout(8000) }
    )
    if (!resp.ok) {
      // Reset crumb and retry once
      yahooCrumb = null
      return res.status(resp.status).json({ error: 'Yahoo API error' })
    }
    const data = await resp.json()
    res.json(data)
  } catch (e) {
    yahooCrumb = null
    res.status(502).json({ error: e.message })
  }
})

// Data sources (CRUD protected, /data public for display widgets)
app.get('/api/v1/datasources/:id/data', (req, res) => {
  try {
    const row = require('./src/db/index').getDb()
      .prepare('SELECT last_data_json, last_fetched_at, last_error FROM data_sources WHERE id = ?')
      .get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json({
      data: row.last_data_json ? JSON.parse(row.last_data_json) : null,
      fetchedAt: row.last_fetched_at,
      error: row.last_error || null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.use('/api/v1/datasources', requireAuth, require('./src/routes/datasources'))

// ── Display pages (Android TV — public, no auth) ──────────────────────────
app.use('/display', require('./src/routes/display'))

// ── SPA fallback (production) ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10)
app.listen(PORT, () => {
  console.log(`[Screen Editor] Listening on :${PORT}`)
  console.log(`[Display] http://localhost:${PORT}/display/<slug>`)
})
