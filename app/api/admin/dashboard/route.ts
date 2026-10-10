import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'
import { getStoredCharacters } from '@/lib/data/characterStore'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await safeDb(async () => {
    const [
      totalCharacters,
      publishedCharacters,
      noGuideCharacters,
      totalGuides,
      publishedGuides,
      recentGuides,
      pendingJobs,
      failedJobs,
      recentJobs,
      totalPages,
    ] = await Promise.all([
      prisma.character.count(),
      prisma.character.count({ where: { isPublished: true } }),
      prisma.character.count({
        where: {
          guides: { none: { status: 'PUBLISHED' } },
        },
      }),
      prisma.buildGuide.count(),
      prisma.buildGuide.count({ where: { status: 'PUBLISHED' } }),
      prisma.buildGuide.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          character: { select: { name: true, slug: true, element: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
      prisma.processingJob.count({ where: { status: { in: ['PENDING', 'RUNNING'] } } }),
      prisma.processingJob.count({ where: { status: 'FAILED' } }),
      prisma.processingJob.findMany({
        include: {
          character: { select: { name: true, slug: true } },
          guide: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.guidePage.count(),
    ])

    return {
      stats: {
        totalCharacters,
        publishedCharacters,
        noGuideCharacters,
        totalGuides,
        publishedGuides,
        totalPages,
        pendingJobs,
        failedJobs,
      },
      recentGuides,
      recentJobs,
    }
  }, null)

  if (data) {
    return NextResponse.json(data)
  }

  // Fallback statistics when PostgreSQL is not running
  const characters = getStoredCharacters()
  const fallbackGuides = characters.flatMap(c =>
    (c.guides || []).map(g => ({
      id: g.id,
      title: g.title,
      version: g.version,
      pageCount: g.pageCount,
      publishedAt: g.publishedAt,
      character: {
        name: c.name,
        slug: c.slug,
        element: c.element,
      },
    }))
  ).slice(0, 5)

  return NextResponse.json({
    stats: {
      totalCharacters: characters.length,
      publishedCharacters: characters.filter(c => c.isPublished).length,
      noGuideCharacters: characters.filter(c => !c.guides || c.guides.length === 0).length,
      totalGuides: fallbackGuides.length,
      publishedGuides: fallbackGuides.length,
      totalPages: fallbackGuides.reduce((acc, g) => acc + g.pageCount, 0),
      pendingJobs: 0,
      failedJobs: 0,
    },
    recentGuides: fallbackGuides,
    recentJobs: [],
  })
}
