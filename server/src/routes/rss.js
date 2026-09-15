'use strict'

const express = require('express')
const router = express.Router()

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 10 * 60 * 1000 // 10 min

// GET /api/v1/rss?url=https://...
router.get('/', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url parameter' })

  // Check cache
  const cached = cache.get(url)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data)
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ScreenEditor/1.0 RSS Reader' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const xml = await response.text()

    const items = parseRss(xml)
    const result = { items: items.slice(0, 30), source: url }
    cache.set(url, { ts: Date.now(), data: result })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function parseRss(xml) {
  const items = []
  // Support RSS 2.0 and Atom
  const itemBlocks = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g),
                      ...xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/g)]

  for (const match of itemBlocks) {
    const inner = match[1]
    const title = extractText(inner, 'title')
    const description = extractText(inner, 'description') || extractText(inner, 'summary')
    const link = extractText(inner, 'link') || (inner.match(/<link[^>]+href="([^"]+)"/) || [])[1] || ''
    const pubDate = extractText(inner, 'pubDate') || extractText(inner, 'published') || extractText(inner, 'updated')
    if (title) {
      items.push({
        title: stripHtml(title).trim(),
        description: stripHtml(description || '').trim().slice(0, 200),
        link: link.trim(),
        pubDate: pubDate ? new Date(pubDate).toISOString() : null,
      })
    }
  }
  return items
}

function extractText(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i')
  return (xml.match(re) || [])[1] || ''
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ')
}

module.exports = router
