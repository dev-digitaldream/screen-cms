'use strict'

function requireAuth(req, res, next) {
  if (req.session?.userId) return next()
  res.status(401).json({ error: 'Unauthorized' })
}

function requireAdmin(req, res, next) {
  if (req.session?.userId && req.session?.role === 'admin') return next()
  res.status(403).json({ error: 'Forbidden: admin only' })
}

module.exports = { requireAuth, requireAdmin }
