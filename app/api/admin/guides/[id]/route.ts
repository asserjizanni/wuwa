import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import {
  deleteStoredGuide,
  publishStoredGuide,
  getStoredCharacters,
} from '@/lib/data/characterStore'

// GET /api/admin/guides/[id] - Get guide with pages and job
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const guide = await safeDb(
    () =>
      prisma.buildGuide.findUnique({
        where: { id },
        include: {
          character: { select: { name: true, slug: true, element: true } },
          pages: { orderBy: { pageNumber: 'asc' } },
          processingJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    null
  )

  if (guide) {
    return NextResponse.json({ guide })
  }

  // Fallback lookup from character store
  const allChars = getStoredCharacters()
  for (const c of allChars) {
    const found = c.guides?.find((g: any) => g.id === id)
    if (found) {
      return NextResponse.json({
        guide: {
          ...found,
          character: { name: c.name, slug: c.slug, element: c.element },
          pages: found.pages || [],
        },
      })
    }
  }

  return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
}

// PATCH /api/admin/guides/[id] - Update guide (publish, title, page reorder)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const { action, title, isActive } = body

  // Also update in characterStore
  if (action === 'publish') {
    publishStoredGuide(id)
  }

  const result = await safeDb(async () => {
    if (action === 'publish') {
      const guide = await prisma.buildGuide.findUnique({
        where: { id },
        select: { status: true, characterId: true, pageCount: true },
      })

      if (!guide) return { error: 'Guide not found', status: 404 }

      await prisma.$transaction([
        prisma.buildGuide.updateMany({
          where: { characterId: guide.characterId, id: { not: id } },
          data: { isActive: false },
        }),
        prisma.buildGuide.update({
          where: { id },
          data: {
            status: 'PUBLISHED',
            isActive: true,
            publishedAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      ])
      return { success: true }
    }

    const updated = await prisma.buildGuide.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    })

    try {
      revalidatePath('/')
      revalidatePath('/characters')
    } catch {}

    return { guide: updated }
  }, { success: true })

  try {
    revalidatePath('/')
    revalidatePath('/characters')
  } catch {}

  return NextResponse.json(result)
}

// DELETE /api/admin/guides/[id] - Permanently delete a guide
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  // Delete from DB if connected
  await safeDb(async () => {
    await prisma.$transaction(async (tx) => {
      await tx.guidePage.deleteMany({ where: { guideId: id } })
      await tx.processingJob.deleteMany({ where: { guideId: id } })
      await tx.buildGuide.delete({ where: { id } })
    })
  }, null)

  // Always delete from characterStore
  deleteStoredGuide(id)

  try {
    revalidatePath('/')
    revalidatePath('/characters')
  } catch {}

  return NextResponse.json({ success: true, message: 'Guide deleted successfully' })
}
