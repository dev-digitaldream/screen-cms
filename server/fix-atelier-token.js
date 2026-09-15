#!/usr/bin/env node

const Database = require('better-sqlite3')
const crypto = require('crypto')

const DB_PATH = './data/database.db'

console.log('🔧 Fixing token for "atelier" screen...')

try {
  const db = new Database(DB_PATH, { readonly: false })
  
  // Check if atelier screen exists
  const screen = db.prepare('SELECT id, slug, name, display_token FROM layouts WHERE slug = ?').get('atelier')
  
  if (!screen) {
    console.log('❌ Screen "atelier" not found. Creating it...')
    const id = crypto.randomUUID()
    const token = crypto.randomBytes(6).toString('hex')
    const now = new Date().toISOString()
    
    db.prepare(`
      INSERT INTO layouts (id, slug, name, display_token, layout_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, 'atelier', 'Atelier', token, '{}', now, now)
    
    console.log(`✅ Created "atelier" screen with token: ${token}`)
  } else {
    console.log(`📊 Found "atelier" screen: ${screen.name}`)
    console.log(`Current token: ${screen.display_token || 'MISSING'}`)
    
    if (!screen.display_token || screen.display_token === '') {
      const token = crypto.randomBytes(6).toString('hex')
      db.prepare('UPDATE layouts SET display_token = ? WHERE id = ?').run(token, screen.id)
      console.log(`✅ Generated new token: ${token}`)
    } else {
      console.log(`ℹ️  Token already exists: ${screen.display_token}`)
    }
  }
  
  // Show final URL
  const finalScreen = db.prepare('SELECT display_token FROM layouts WHERE slug = ?').get('atelier')
  const url = `https://your-domain.com/display/atelier?t=${finalScreen.display_token}`
  console.log(`\n🌐 Display URL: ${url}`)
  
  db.close()
  console.log('\n✅ Done!')
  
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
