#!/usr/bin/env tsx
/**
 * Initial setup script
 * Run: npm run setup
 * 
 * 1. Validates environment variables
 * 2. Connects to database
 * 3. Creates storage directories
 * 4. Checks PDF processing dependencies
 */

import path from 'path'
import fs from 'fs/promises'
import { spawn } from 'child_process'

async function checkEnv(): Promise<boolean> {
  const required = ['DATABASE_URL', 'SESSION_SECRET', 'JWT_SECRET']
  const missing = required.filter(k => !process.env[k])
  
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`)
    console.error('   Copy .env.example to .env.local and fill in the values.\n')
    return false
  }
  
  console.log('✅ Environment variables OK')
  return true
}

async function initStorage(): Promise<void> {
  const storagePath = process.env.STORAGE_PATH || './storage'
  const dirs = [
    storagePath,
    path.join(storagePath, 'characters'),
    path.join(storagePath, 'temp'),
  ]
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true })
  }
  console.log(`✅ Storage directories initialized at: ${path.resolve(storagePath)}`)
}

async function checkPythonDeps(): Promise<void> {
  return new Promise((resolve) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const proc = spawn(pythonCmd, ['-c', 'import fitz; print(f"PyMuPDF {fitz.version[0]} OK")'])
    
    let output = ''
    proc.stdout.on('data', (d: Buffer) => output += d.toString())
    proc.stderr.on('data', (d: Buffer) => output += d.toString())
    
    proc.on('close', (code: number) => {
      if (code === 0) {
        console.log(`✅ ${output.trim()}`)
      } else {
        console.warn('⚠️  PyMuPDF not found. PDF processing will be unavailable.')
        console.warn('   Install with: pip install PyMuPDF')
      }
      resolve()
    })
    
    proc.on('error', () => {
      console.warn('⚠️  Python not found. PDF processing will be unavailable.')
      console.warn('   Install Python 3.8+ from https://python.org')
      resolve()
    })
  })
}

async function main() {
  console.log('\n🌊 Wuthering Waves Builds Hub — Setup\n')
  console.log('─'.repeat(50))
  
  // Load env
  const dotenv = await import('dotenv')
  dotenv.config({ path: '.env.local' })
  
  const envOk = await checkEnv()
  if (!envOk) process.exit(1)
  
  await initStorage()
  await checkPythonDeps()
  
  console.log('\n✅ Setup complete!')
  console.log('\nNext steps:')
  console.log('  1. Ensure PostgreSQL is running')
  console.log('  2. Run: npm run db:migrate')
  console.log('  3. Run: npm run admin:create')
  console.log('  4. Run: npm run db:seed')
  console.log('  5. Run: npm run dev\n')
}

main().catch(err => {
  console.error('Setup failed:', err)
  process.exit(1)
})
