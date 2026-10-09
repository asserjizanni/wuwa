import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const characterId = searchParams.get('characterId') || ''
  const status = searchParams.get('status') || ''

  const result = await safeDb(async () => {
    const where: any = {}
    if (characterId) where.characterId = characterId
    if (status) where.status = status

    const [guides, total] = await Promise.all([
      prisma.buildGuide.findMany({
        where,
        include: {
          character: {
            select: { id: true, name: true, slug: true, element: true, rarity: true, portraitPath: true },
          },
          pages: {
            select: { id: true, pageNumber: true, thumbnailPath: true },
            orderBy: { pageNumber: 'asc' },
            take: 4,
          },
          processingJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true, progress: true, errorMessage: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.buildGuide.count({ where }),
    ])

    return {
      guides,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }, null)

  if (result) {
    return NextResponse.json(result)
  }

  // Fallback guides
  const fallbackGuides = FALLBACK_CHARACTERS.flatMap(c =>
    c.guides.map(g => ({
      id: g.id,
      title: g.title,
      version: g.version,
      pageCount: g.pageCount,
      status: 'PUBLISHED',
      isActive: true,
      publishedAt: g.publishedAt,
      createdAt: g.publishedAt,
      character: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        element: c.element,
        rarity: c.rarity,
        portraitPath: c.portraitPath,
      },
      pages: (g.pages || []).map(p => ({
        id: p.id,
        pageNumber: p.pageNumber,
        thumbnailPath: p.thumbnailPath,
      })),
      processingJobs: [],
    }))
  )

  const total = fallbackGuides.length
  return NextResponse.json({
    guides: fallbackGuides.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
