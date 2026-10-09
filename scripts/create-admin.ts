#!/usr/bin/env tsx
/**
 * Admin creation script
 * Run: npm run admin:create
 * 
 * Creates the first administrator account securely.
 * Credentials are provided via environment variables or interactive prompt.
 */

import * as readline from 'readline'
import bcrypt from 'bcryptjs'

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: hidden ? undefined : process.stdout,
  })

  return new Promise((resolve) => {
    if (hidden) {
      process.stdout.write(question)
      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.setEncoding('utf8')

      let password = ''
      process.stdin.on('data', (char: string) => {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdout.write('\n')
          rl.close()
          resolve(password)
        } else if (char === '\u0003') {
          process.exit()
        } else if (char === '\u007f') {
          password = password.slice(0, -1)
          process.stdout.clearLine(0)
          process.stdout.cursorTo(0)
          process.stdout.write(question + '*'.repeat(password.length))
        } else {
          password += char
          process.stdout.write('*')
        }
      })
    } else {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer)
      })
    }
  })
}

async function main() {
  console.log('\n🌊 Wuthering Waves Builds Hub — Create Administrator\n')
  console.log('─'.repeat(50))

  // Load env
  const dotenv = await import('dotenv')
  dotenv.config({ path: '.env.local' })

  // Dynamic import to allow env loading first
  const { prisma } = await import('../lib/db')

  try {
    await (prisma as any).$connect()
    console.log('✅ Database connected\n')
  } catch (err) {
    console.error('❌ Database connection failed:', err)
    console.error('   Ensure DATABASE_URL is set and PostgreSQL is running.')
    process.exit(1)
  }

  const email = await prompt('Admin email: ')
  if (!email.includes('@')) {
    console.error('❌ Invalid email address')
    process.exit(1)
  }

  // Check if admin already exists
  const existing = await (prisma as any).adminUser.findUnique({ where: { email } })
  if (existing) {
    console.error(`❌ Administrator with email "${email}" already exists`)
    process.exit(1)
  }

  const name = await prompt('Admin name (optional): ')
  const password = await prompt('Password (min 12 chars): ', true)

  if (password.length < 12) {
    console.error('❌ Password must be at least 12 characters')
    process.exit(1)
  }

  const confirmPassword = await prompt('Confirm password: ', true)
  if (password !== confirmPassword) {
    console.error('❌ Passwords do not match')
    process.exit(1)
  }

  const saltRounds = 12
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const admin = await (prisma as any).adminUser.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || null,
      role: 'SUPER_ADMIN',
    },
  })

  console.log(`\n✅ Administrator created:`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Role:  ${admin.role}`)
  console.log(`   ID:    ${admin.id}`)
  console.log(`\nLogin at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/control-center/login\n`)

  await (prisma as any).$disconnect()
}

main().catch(err => {
  console.error('Failed to create admin:', err)
  process.exit(1)
})
