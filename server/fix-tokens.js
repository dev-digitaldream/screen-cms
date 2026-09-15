#!/usr/bin/env node

const Database = require('better-sqlite3')
const crypto = require('crypto')

// Path to database
const DB_PATH = './data/database.db'

console.log('🔧 Fixing missing display tokens...')

try {
  const db = new Database(DB_PATH, { readonly: false })
  
  // Check current state
  const screens = db.prepare('SELECT id, slug, name, display_token FROM layouts').all()
  console.log(`📊 Found ${screens.length} screens`)
  
  const missingTokens = screens.filter(s => !s.display_token || s.display_token === '')
  console.log(`❌ ${missingTokens.length} screens missing display token`)
  
  if (missingTokens.length > 0) {
    const updateToken = db.prepare('UPDATE layouts SET display_token = ? WHERE id = ?')
    
    missingTokens.forEach(screen => {
      const token = crypto.randomBytes(6).toString('hex')
      updateToken.run(token, screen.id)
      console.log(`✅ Generated token for "${screen.name}" (${screen.slug}): ${token}`)
    })
  }
  
  // Verify all tokens now exist
  const finalCheck = db.prepare('SELECT COUNT(*) as count FROM layouts WHERE display_token IS NULL OR display_token = ""').get()
  if (finalCheck.count === 0) {
    console.log('🎉 All screens now have display tokens!')
  } else {
    console.log(`⚠️  Still ${finalCheck.count} screens without tokens`)
  }
  
  // Show all tokens for reference
  console.log('\n📋 Current screen tokens:')
  const allScreens = db.prepare('SELECT slug, name, display_token FROM layouts ORDER BY name').all()
  allScreens.forEach(screen => {
    console.log(`  ${screen.name} (${screen.slug}): ${screen.display_token || 'MISSING'}`)
  })
  
  db.close()
  console.log('\n✅ Done!')
  
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
