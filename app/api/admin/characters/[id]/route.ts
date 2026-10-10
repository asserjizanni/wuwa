import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'
import {
  getStoredCharacter,
  updateStoredCharacter,
  deleteStoredCharacter,
} from '@/lib/data/characterStore'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  element: z.enum(['AERO', 'SPECTRO', 'FUSION', 'ELECTRO', 'GLACIO', 'HAVOC']).optional(),
  weaponType: z.enum(['BROADBLADE', 'SWORD', 'PISTOLS', 'GAUNTLETS', 'RECTIFIER']).optional(),
  rarity: z.enum(['FOUR_STAR', 'FIVE_STAR']).optional(),
  description: z.string().max(2000).optional().nullable(),
  sourceUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  portraitPath: z.string().optional().nullable(),
  backgroundPath: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const character = await safeDb(
    () =>
      prisma.character.findUnique({
        where: { id },
        include: {
          guides: {
            include: {
              pages: { orderBy: { pageNumber: 'asc' } },
              processingJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
          },
          processingJobs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
    null
  )

  if (character) {
    return NextResponse.json({ character })
  }

  // Fallback character from persistent store
  const fallback = getStoredCharacter(id)
  if (fallback) {
    return NextResponse.json({ character: fallback })
  }

  return NextResponse.json({ error: 'Character not found' }, { status: 404 })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  // Sanitize: fallback session ID is not a real DB cuid — use null for audit log
  const auditAdminId = session.adminId && session.adminId !== 'admin-system-master' ? session.adminId : null

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const character = await safeDb(async () => {
      return prisma.$transaction(async (tx) => {
        const char = await tx.character.update({
          where: { id },
          data: {
            ...data,
            sourceUrl: data.sourceUrl || null,
            updatedAt: new Date(),
          },
        })

        await tx.auditLog.create({
          data: {
            adminUserId: auditAdminId,
            action: 'UPDATE_CHARACTER',
            targetType: 'Character',
            targetId: char.id,
            details: data as any,
          },
        })

        return char
      })
    }, null)

    if (character) {
      updateStoredCharacter(id, {
        ...data,
        sourceUrl: data.sourceUrl || null,
      })
      return NextResponse.json({ character })
    }

    // Fallback response for offline or simulated updates
    const updated = updateStoredCharacter(id, {
      ...data,
      sourceUrl: data.sourceUrl || null,
    })
    if (updated) {
      return NextResponse.json({ character: updated })
    }

    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 422 })
    }
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const auditAdminId = session.adminId && session.adminId !== 'admin-system-master' ? session.adminId : null

  const body = await request.json().catch(() => ({}))
  if (body.confirm !== true) {
    return NextResponse.json(
      { error: 'Explicit confirmation required (confirm: true)' },
      { status: 400 }
    )
  }

  await safeDb(async () => {
    const character = await prisma.character.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    })

    if (character) {
      await prisma.$transaction(async (tx) => {
        const guides = await tx.buildGuide.findMany({
          where: { characterId: id },
          select: { id: true },
        })
        const guideIds = guides.map(g => g.id)
        if (guideIds.length > 0) {
          await tx.guidePage.deleteMany({ where: { guideId: { in: guideIds } } })
          await tx.processingJob.deleteMany({ where: { guideId: { in: guideIds } } })
          await tx.buildGuide.deleteMany({ where: { characterId: id } })
        }
        await tx.processingJob.deleteMany({ where: { characterId: id } })
        await tx.character.delete({ where: { id } })
        if (auditAdminId) {
          await tx.auditLog.create({
            data: {
              adminUserId: auditAdminId,
              action: 'DELETE_CHARACTER',
              targetType: 'Character',
              targetId: id,
              details: { name: character.name, slug: character.slug },
            },
          }).catch(() => {})
        }
      })
    }
  }, null)

  deleteStoredCharacter(id)

  return NextResponse.json({ success: true, message: 'Character deleted successfully' })
}
