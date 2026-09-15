'use strict'
const express = require('express')
const crypto = require('crypto')
const { getDb } = require('../db/index')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const router = express.Router()
const MAX_LOGS = 300 // max log entries per device

// POST /api/v1/devices — register new device (public, from APK)
router.post('/', (req, res) => {
  // id can come from APK (it generates its own UUID)
  const { id, name, model, androidVersion, sdkInt, appVersion } = req.body
  const deviceId = id || crypto.randomUUID()
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO devices (id, name, model, android_version, sdk_int, app_version, config_json, logs_json, created_at, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, '{}', '[]', ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, last_seen=excluded.last_seen
  `).run(deviceId, name || 'Android TV', model || '', androidVersion || '', sdkInt || 0, appVersion || '1.0.0', now, now)
  res.json({ deviceId, ok: true })
})

// GET /api/v1/devices — list all (protected, from CMS)
router.get('/', requireAuth, (req, res) => {
  const db = getDb()
  const devices = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all()
  res.json(devices.map(d => ({
    ...d,
    config: JSON.parse(d.config_json || '{}'),
    logs: JSON.parse(d.logs_json || '[]').slice(-50), // last 50 for list view
    isOnline: d.last_seen && (Date.now() - new Date(d.last_seen).getTime()) < 20 * 60_000,
  })))
})

// GET /api/v1/devices/:id — get one device (protected)
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const d = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!d) return res.status(404).json({ error: 'Not found' })
  res.json({ ...d, config: JSON.parse(d.config_json || '{}'), logs: JSON.parse(d.logs_json || '[]') })
})

// POST /api/v1/devices/:id/heartbeat — update from APK (public)
router.post('/:id/heartbeat', (req, res) => {
  const db = getDb()
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!device) return res.status(404).json({ error: 'Unknown device' })

  const { deviceName, model, androidVersion, sdkInt, appVersion, loadedSlug, memUsedMb, memTotalMb, logs } = req.body
  const now = new Date().toISOString()
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''

  // Merge incoming logs into stored logs
  let storedLogs = JSON.parse(device.logs_json || '[]')
  if (Array.isArray(logs)) storedLogs = [...storedLogs, ...logs].slice(-MAX_LOGS)

  db.prepare(`
    UPDATE devices SET
      name = COALESCE(?, name),
      model = COALESCE(?, model),
      android_version = COALESCE(?, android_version),
      sdk_int = COALESCE(?, sdk_int),
      app_version = COALESCE(?, app_version),
      loaded_slug = ?,
      mem_used_mb = ?,
      mem_total_mb = ?,
      logs_json = ?,
      last_seen = ?,
      last_ip = ?
    WHERE id = ?
  `).run(deviceName, model, androidVersion, sdkInt, appVersion, loadedSlug || '', memUsedMb || 0, memTotalMb || 0, JSON.stringify(storedLogs), now, ip, req.params.id)

  // Return current config to APK
  const config = JSON.parse(device.config_json || '{}')
  res.json({ ok: true, config })

  // Auto-reset one-shot flags after sending
  if (config.forceReload || config.clearCache || config.sleep || config.wake || config.reboot) {
    const reset = { ...config, forceReload: false, clearCache: false, sleep: false, wake: false, reboot: false }
    db.prepare('UPDATE devices SET config_json = ? WHERE id = ?')
      .run(JSON.stringify(reset), req.params.id)
  }
})

// PUT /api/v1/devices/:id — update device config from CMS (protected)
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const { name, config } = req.body
  db.prepare('UPDATE devices SET name = COALESCE(?, name), config_json = ? WHERE id = ?')
    .run(name, JSON.stringify(config || {}), req.params.id)
  res.json({ ok: true })
})

// DELETE /api/v1/devices/:id — delete (protected)
router.delete('/:id', requireAdmin, (req, res) => {
  getDb().prepare('DELETE FROM devices WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// DELETE /api/v1/devices/:id/logs — clear logs (protected)
router.delete('/:id/logs', requireAuth, (req, res) => {
  getDb().prepare("UPDATE devices SET logs_json = '[]' WHERE id = ?").run(req.params.id)
  res.json({ ok: true })
})

// POST /api/v1/devices/:id/sync-screen — sync screen config to device (protected)
router.post('/:id/sync-screen', requireAuth, (req, res) => {
  const db = getDb()
  const { screenSlug } = req.body
  if (!screenSlug) return res.status(400).json({ error: 'screenSlug required' })
  
  // Get screen configuration
  const screen = db.prepare('SELECT config_json FROM screens WHERE slug = ?').get(screenSlug)
  if (!screen) return res.status(404).json({ error: 'Screen not found' })
  
  const screenConfig = JSON.parse(screen.config_json || '{}')
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  
  // Update device config with rotation
  const deviceConfig = JSON.parse(device.config_json || '{}')
  deviceConfig.rotation = screenConfig.rotation || '0'
  
  db.prepare('UPDATE devices SET config_json = ? WHERE id = ?')
    .run(JSON.stringify(deviceConfig), req.params.id)
  
  res.json({ ok: true, rotation: deviceConfig.rotation })
})

module.exports = router
