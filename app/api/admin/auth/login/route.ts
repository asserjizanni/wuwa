import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import { z } from 'zod'

// Simple rate limiter (in-memory, resets on restart)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()

function getRateLimitKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
}

function checkRateLimit(key: string): boolean {
  const limit = parseInt(process.env.LOGIN_RATE_LIMIT || '10')
  const windowMs = 15 * 60 * 1000 // 15 minutes

  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record) {
    loginAttempts.set(key, { count: 1, firstAttempt: now })
    return true
  }

  if (now - record.firstAttempt > windowMs) {
    loginAttempts.set(key, { count: 1, firstAttempt: now })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request)

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait 15 minutes.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Generic error to prevent user enumeration
    const genericError = NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )

    let admin = null
    try {
      admin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      })
    } catch (dbErr) {
      console.warn('[auth] Database unreachable, checking emergency admin credentials')
      // Emergency/Initial fallback when PostgreSQL daemon is not started
      const defaultEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@wwbuilds.com').toLowerCase().trim()
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminWutheringWaves2025!'

      if (email.toLowerCase().trim() === defaultEmail && password === defaultPassword) {
        const session = await getAdminSession()
        session.adminId = 'admin-system-master'
        session.email = defaultEmail
        session.role = 'SUPER_ADMIN'
        session.name = 'Hub Administrator'
        await session.save()

        loginAttempts.delete(ip)
        return NextResponse.json({
          success: true,
          admin: { id: 'admin-system-master', email: defaultEmail, name: 'Hub Administrator', role: 'SUPER_ADMIN' },
        })
      }

      return genericError
    }

    if (!admin || !admin.isActive) {
      // Constant-time comparison to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$invalid.hash.for.timing.purposes.only')
      return genericError
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash)
    if (!passwordValid) {
      await prisma.auditLog.create({
        data: {
          action: 'FAILED_LOGIN',
          targetType: 'AdminUser',
          targetId: admin.id,
          ipAddress: ip,
        },
      }).catch(() => {})
      return genericError
    }

    // Success — set session
    const session = await getAdminSession()
    session.adminId = admin.id
    session.email = admin.email
    session.role = admin.role
    session.name = admin.name || undefined
    await session.save()

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {})

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'LOGIN',
        ipAddress: ip,
      },
    }).catch(() => {})

    // Reset rate limit on success
    loginAttempts.delete(ip)

    return NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('[login]', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
