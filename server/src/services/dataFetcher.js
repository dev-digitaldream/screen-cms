'use strict'

const vm = require('vm')
const { getDb } = require('../db/index')

// ── Fetch a single data source and persist result ─────────────────────────

async function fetchDataSource(row) {
  const db = getDb()

  // Build request options
  const headers = { ...JSON.parse(row.headers_json || '{}') }

  if (row.auth_type === 'bearer' && row.auth_value) {
    headers['Authorization'] = `Bearer ${row.auth_value}`
  } else if (row.auth_type === 'basic' && row.auth_value) {
    headers['Authorization'] = `Basic ${Buffer.from(row.auth_value).toString('base64')}`
  } else if (row.auth_type === 'apikey' && row.auth_value) {
    // Expect auth_value as "Header-Name:value"
    const sep = row.auth_value.indexOf(':')
    if (sep > 0) {
      headers[row.auth_value.slice(0, sep)] = row.auth_value.slice(sep + 1)
    }
  }

  const init = { method: row.method || 'GET', headers }
  if (row.body_json && row.method !== 'GET') {
    init.body = row.body_json
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
  }

  let raw
  try {
    const resp = await fetch(row.url, init)
    if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
    const ct = resp.headers.get('content-type') || ''
    raw = ct.includes('application/json') ? await resp.json() : await resp.text()
  } catch (err) {
    db.prepare('UPDATE data_sources SET last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(err.message, row.id)
    throw err
  }

  // Optional JS transform
  let result = raw
  if (row.transform_js) {
    try {
      const sandbox = { data: raw, result: undefined }
      vm.runInNewContext(`result = (${row.transform_js})(data)`, sandbox, { timeout: 500 })
      result = sandbox.result
    } catch (err) {
      // Transform failed — keep raw data, log the error
      db.prepare('UPDATE data_sources SET last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(`Transform error: ${err.message}`, row.id)
    }
  }

  db.prepare(`
    UPDATE data_sources
    SET last_data_json = ?, last_fetched_at = CURRENT_TIMESTAMP, last_error = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(result), row.id)

  return result
}

// ── Background polling loop ────────────────────────────────────────────────

let pollTimer = null

function startPoller(intervalMs = 10_000) {
  if (pollTimer) return

  async function tick() {
    let db
    try { db = getDb() } catch { return } // DB not ready yet

    const now = Math.floor(Date.now() / 1000)
    const rows = db.prepare('SELECT * FROM data_sources').all()

    for (const row of rows) {
      const lastFetched = row.last_fetched_at
        ? Math.floor(new Date(row.last_fetched_at).getTime() / 1000)
        : 0
      const due = now - lastFetched >= row.refresh_s

      if (due) {
        fetchDataSource(row).catch(() => {}) // errors stored in DB
      }
    }
  }

  pollTimer = setInterval(tick, intervalMs)
  tick() // run immediately on start
  console.log('[DataFetcher] Poller started (interval: 10s)')
}

function stopPoller() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

module.exports = { fetchDataSource, startPoller, stopPoller }
