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
    ] = await Promise.all([
      prisma.character.count(),
      prisma.character.count({ where: { isPublished: true } }),
    ])

    return {
      stats: {
        totalCharacters,
        publishedCharacters,
        noGuideCharacters: 0,
        totalGuides: 0,
        publishedGuides: 0,
        totalPages: 0,
        pendingJobs: 0,
        failedJobs: 0,
      },
      recentGuides: [],
      recentJobs: [],
    }
  }, null)

  if (data) {
    return NextResponse.json(data)
  }

  // Fallback statistics when PostgreSQL is not running
  const characters = getStoredCharacters()
  return NextResponse.json({
    stats: {
      totalCharacters: characters.length,
      publishedCharacters: characters.filter(c => c.isPublished).length,
      noGuideCharacters: 0,
      totalGuides: 0,
      publishedGuides: 0,
      totalPages: 0,
      pendingJobs: 0,
      failedJobs: 0,
    },
    recentGuides: [],
    recentJobs: [],
  })
}
