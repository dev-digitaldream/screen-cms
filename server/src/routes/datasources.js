'use strict'

const express = require('express')
const crypto = require('crypto')
const { getDb } = require('../db/index')
const { fetchDataSource } = require('../services/dataFetcher')

const router = express.Router()

// List all
router.get('/', (req, res) => {
  try {
    const rows = getDb().prepare(
      'SELECT id, name, type, url, method, auth_type, refresh_s, last_fetched_at, last_error, created_at, updated_at FROM data_sources ORDER BY name'
    ).all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create
router.post('/', (req, res) => {
  try {
    const { name, type = 'rest', url, method = 'GET', headers = {}, body = null,
            auth_type = 'none', auth_value = null, refresh_s = 60, transform_js = null } = req.body

    if (!name || !url) return res.status(400).json({ error: 'name and url are required' })

    const id = crypto.randomUUID()
    getDb().prepare(`
      INSERT INTO data_sources (id, name, type, url, method, headers_json, body_json, auth_type, auth_value, refresh_s, transform_js)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, type, url, method, JSON.stringify(headers), body ? JSON.stringify(body) : null,
           auth_type, auth_value, refresh_s, transform_js)

    res.status(201).json({ id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get one (with latest data)
router.get('/:id', (req, res) => {
  try {
    const row = getDb().prepare('SELECT * FROM data_sources WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Not found' })

    const out = { ...row, headers: JSON.parse(row.headers_json || '{}') }
    if (row.last_data_json) out.last_data = JSON.parse(row.last_data_json)
    delete out.headers_json
    delete out.auth_value  // never expose
    res.json(out)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update
router.put('/:id', (req, res) => {
  try {
    const row = getDb().prepare('SELECT id FROM data_sources WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Not found' })

    const { name, type, url, method, headers, body, auth_type, auth_value, refresh_s, transform_js } = req.body

    getDb().prepare(`
      UPDATE data_sources SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        url = COALESCE(?, url),
        method = COALESCE(?, method),
        headers_json = COALESCE(?, headers_json),
        body_json = COALESCE(?, body_json),
        auth_type = COALESCE(?, auth_type),
        auth_value = COALESCE(?, auth_value),
        refresh_s = COALESCE(?, refresh_s),
        transform_js = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? null, type ?? null, url ?? null, method ?? null,
      headers ? JSON.stringify(headers) : null,
      body !== undefined ? (body ? JSON.stringify(body) : null) : null,
      auth_type ?? null, auth_value ?? null, refresh_s ?? null,
      transform_js ?? null,
      req.params.id
    )

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete
router.delete('/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM data_sources WHERE id = ?').run(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Force refresh
router.post('/:id/refresh', async (req, res) => {
  try {
    const row = getDb().prepare('SELECT * FROM data_sources WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    const result = await fetchDataSource(row)
    res.json({ ok: true, data: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
