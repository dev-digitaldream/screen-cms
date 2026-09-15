'use strict'

const express = require('express')
const { getDb } = require('../db/index')
const crypto = require('crypto')

const router = express.Router()

// GET /api/v1/screens — list all layouts
router.get('/', (req, res) => {
  try {
    const db = getDb()
    const layouts = db.prepare(`
      SELECT id, slug, name, display_token, updated_at,
        json_extract(layout_json, '$.screenConfig.backgroundColor') as background_color,
        json_extract(layout_json, '$.screenConfig.backgroundType') as background_type,
        json_extract(layout_json, '$.screenConfig.gradientColor1') as gradient_color1,
        json_extract(layout_json, '$.screenConfig.gradientColor2') as gradient_color2,
        json_extract(layout_json, '$.screenConfig.gradientDir') as gradient_dir,
        (SELECT count(*) FROM json_each(layout_json, '$.widgetOrder')) as widget_count
      FROM layouts ORDER BY updated_at DESC
    `).all()
    res.json(layouts)
  } catch (err) {
    console.error('[ERROR] GET /screens:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/v1/screens/:slug — get specific layout
router.get('/:slug', (req, res) => {
  try {
    const db = getDb()
    const layout = db.prepare('SELECT * FROM layouts WHERE slug = ?').get(req.params.slug)
    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' })
    }
    res.json({ ...JSON.parse(layout.layout_json), _displayToken: layout.display_token })
  } catch (err) {
    console.error('[ERROR] GET /screens/:slug:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/v1/screens — create new layout
router.post('/', (req, res) => {
  try {
    const { slug, name, layout } = req.body
    if (!slug || !name) {
      return res.status(400).json({ error: 'Missing slug or name' })
    }

    const db = getDb()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const display_token = require('crypto').randomBytes(6).toString('hex')

    db.prepare(`
      INSERT INTO layouts (id, slug, name, display_token, layout_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, slug, name, display_token, JSON.stringify(layout || {}), now, now)

    res.status(201).json({ id, slug, name, display_token, created_at: now })
  } catch (err) {
    console.error('[ERROR] POST /screens:', err)
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Slug already exists' })
    }
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/v1/screens/:slug — save/update layout
router.put('/:slug', (req, res) => {
  try {
    const { layout } = req.body
    if (!layout) {
      return res.status(400).json({ error: 'Missing layout' })
    }

    const db = getDb()
    const now = new Date().toISOString()

    const result = db.prepare(`
      UPDATE layouts SET layout_json = ?, updated_at = ? WHERE slug = ?
    `).run(JSON.stringify(layout), now, req.params.slug)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Layout not found' })
    }

    res.json({ success: true, updated_at: now })
  } catch (err) {
    console.error('[ERROR] PUT /screens/:slug:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/v1/screens/:slug — delete layout
router.delete('/:slug', (req, res) => {
  try {
    const db = getDb()
    const result = db.prepare('DELETE FROM layouts WHERE slug = ?').run(req.params.slug)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Layout not found' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[ERROR] DELETE /screens/:slug:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
