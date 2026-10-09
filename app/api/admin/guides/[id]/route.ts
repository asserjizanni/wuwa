import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'

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

  if (!guide) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  }

  return NextResponse.json({ guide })
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
    return { guide: updated }
  }, { success: true })

  return NextResponse.json(result)
}

// DELETE /api/admin/guides/[id] - Archive (not delete) a guide
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  await safeDb(async () => {
    const guide = await prisma.buildGuide.findUnique({
      where: { id },
      select: { isActive: true },
    })

    if (guide && !guide.isActive) {
      await prisma.buildGuide.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      })
    }
  }, null)

  return NextResponse.json({ success: true })
}
