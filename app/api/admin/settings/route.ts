import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import { z } from 'zod'

const DEFAULT_SETTINGS = {
  site_name: 'Wuthering Waves Builds Hub',
  site_description: 'The ultimate resource for Wuthering Waves character builds, guides, and the WuwaFlex builder.',
  allow_guide_download: 'false',
  maintenance_mode: 'false',
  max_pdf_size_mb: '100',
  pdf_render_dpi: '250',
  default_language: 'ar',
}

const settingSchema = z.object({
  settingKey: z.string().min(1).max(100),
  settingValue: z.string().max(10000),
})

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await safeDb(async () => {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { settingKey: 'asc' },
    })

    const settingsMap = Object.fromEntries(
      settings.map(s => [s.settingKey, s.settingValue])
    )

    return { settings: { ...DEFAULT_SETTINGS, ...settingsMap }, raw: settings }
  }, null)

  if (result) {
    return NextResponse.json(result)
  }

  return NextResponse.json({
    settings: DEFAULT_SETTINGS,
    raw: Object.entries(DEFAULT_SETTINGS).map(([k, v]) => ({ settingKey: k, settingValue: v })),
  })
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const updates: Array<{ key: string; value: string }> = []

    for (const [key, value] of Object.entries(body)) {
      if (typeof key !== 'string' || typeof value !== 'string') continue
      settingSchema.parse({ settingKey: key, settingValue: value })
      updates.push({ key, value })
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 })
    }

    await safeDb(async () => {
      await prisma.$transaction(
        updates.map(({ key, value }) =>
          prisma.siteSetting.upsert({
            where: { settingKey: key },
            update: { settingValue: value },
            create: { settingKey: key, settingValue: value },
          })
        )
      )

      await prisma.auditLog.create({
        data: {
          adminUserId: session.adminId,
          action: 'UPDATE_SETTINGS',
          targetType: 'SiteSetting',
          targetId: 'multiple',
          details: { updatedKeys: updates.map(u => u.key) },
        },
      })
    }, null)

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid settings format', details: err.issues }, { status: 422 })
    }
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
