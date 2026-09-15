'use strict'

const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { getDb } = require('../db/index')

module.exports = function createUploadsRouter(dataDir) {
  const router = express.Router()
  const uploadDir = path.join(dataDir, 'uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
    },
  })

  const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm']
      const ext = path.extname(file.originalname).toLowerCase()
      if (allowed.includes(ext)) cb(null, true)
      else cb(new Error('File type not allowed'))
    },
  })

  // Multer error handler (file type / size rejections)
  function handleMulterError(err, req, res, next) {
    if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Fichier trop grand (max 20 MB)' })
    if (err) return res.status(400).json({ error: err.message || 'Erreur upload' })
    next()
  }

  // POST /api/v1/uploads
  router.post('/', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next)
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
      try {
        const db = getDb()
        const id = crypto.randomUUID()
        const fileUrl = `/uploads/${req.file.filename}`
        // Detect schema — support both old (path NOT NULL) and new (url) columns
        const cols = db.prepare('PRAGMA table_info(assets)').all().map(c => c.name)
        const hasBoth = cols.includes('path') && cols.includes('url')
        if (hasBoth) {
          // path is NOT NULL so we must fill both
          db.prepare('INSERT INTO assets (id, filename, mimetype, size, path, url) VALUES (?, ?, ?, ?, ?, ?)')
            .run(id, req.file.filename, req.file.mimetype, req.file.size, fileUrl, fileUrl)
        } else if (cols.includes('url')) {
          db.prepare('INSERT INTO assets (id, filename, mimetype, size, url) VALUES (?, ?, ?, ?, ?)')
            .run(id, req.file.filename, req.file.mimetype, req.file.size, fileUrl)
        } else {
          db.prepare('INSERT INTO assets (id, filename, mimetype, size, path) VALUES (?, ?, ?, ?, ?)')
            .run(id, req.file.filename, req.file.mimetype, req.file.size, fileUrl)
        }
        res.status(201).json({ id, url: fileUrl, filename: req.file.filename })
      } catch (dbErr) {
        console.error('[UPLOAD] DB error:', dbErr)
        res.status(500).json({ error: dbErr.message })
      }
    })
  })

  // GET /api/v1/uploads — list all assets
  router.get('/', (req, res) => {
    try {
      const db = getDb()
      const cols = db.prepare('PRAGMA table_info(assets)').all().map(c => c.name)
      const urlCol = cols.includes('url') ? 'url' : 'path'
      const assets = db.prepare(
        `SELECT id, filename, mimetype, size, ${urlCol} as url, created_at FROM assets ORDER BY created_at DESC`
      ).all()
      res.json(assets)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE /api/v1/uploads/:id
  router.delete('/:id', (req, res) => {
    try {
      const db = getDb()
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id)
      if (!asset) return res.status(404).json({ error: 'Not found' })
      const filePath = path.join(uploadDir, asset.filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id)
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
