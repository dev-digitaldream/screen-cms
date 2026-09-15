'use strict'

const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { getDb } = require('../db/index')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' })
  }
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  req.session.userId = user.id
  req.session.username = user.username
  req.session.role = user.role
  res.json({ id: user.id, username: user.username, role: user.role })
})

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }))
})

// GET /api/v1/auth/me
router.get('/me', (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' })
  res.json({ id: req.session.userId, username: req.session.username, role: req.session.role })
})

// POST /api/v1/auth/change-password
router.post('/change-password', (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Unauthorized' })
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Invalid input' })
  }
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Wrong current password' })
  }
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id)
  res.json({ success: true })
})

// GET /api/v1/auth/users — admin only
router.get('/users', requireAdmin, (req, res) => {
  const db = getDb()
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC').all()
  res.json(users)
})

// POST /api/v1/auth/users — admin only
router.post('/users', requireAdmin, (req, res) => {
  const { username, password, role } = req.body
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'username and password (min 6 chars) required' })
  }
  const validRoles = ['admin', 'editor']
  const userRole = validRoles.includes(role) ? role : 'editor'
  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) return res.status(409).json({ error: 'Username already taken' })
  const hash = bcrypt.hashSync(password, 10)
  const id = crypto.randomUUID()
  db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(id, username, hash, userRole)
  res.status(201).json({ id, username, role: userRole })
})

// PUT /api/v1/auth/users/:id — admin only
router.put('/users/:id', requireAdmin, (req, res) => {
  const { username, password, role } = req.body
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const validRoles = ['admin', 'editor']
  const newRole = validRoles.includes(role) ? role : user.role
  const newUsername = username || user.username

  // Prevent removing last admin
  if (user.role === 'admin' && newRole !== 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'admin'").get()
    if (adminCount.n <= 1) return res.status(400).json({ error: 'Cannot demote the last admin' })
  }

  if (password && password.length >= 6) {
    const hash = bcrypt.hashSync(password, 10)
    db.prepare('UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?').run(newUsername, newRole, hash, user.id)
  } else {
    db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(newUsername, newRole, user.id)
  }
  res.json({ id: user.id, username: newUsername, role: newRole })
})

// DELETE /api/v1/auth/users/:id — admin only
router.delete('/users/:id', requireAdmin, (req, res) => {
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.id === req.session.userId) return res.status(400).json({ error: 'Cannot delete your own account' })
  if (user.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'admin'").get()
    if (adminCount.n <= 1) return res.status(400).json({ error: 'Cannot delete the last admin' })
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
  res.json({ success: true })
})

module.exports = router
