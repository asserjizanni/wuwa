import { NextRequest, NextResponse } from 'next/server'
import { loadGuidePages } from '@/lib/blob-store'
import { getStoredCharacters } from '@/lib/data/characterStore'
import { prisma, safeDb } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ guideId: string }> | { guideId: string } }
) {
  const { guideId } = await context.params

  // 1. Try Netlify Blobs
  const blobData = await loadGuidePages(guideId)
  if (blobData) {
    return NextResponse.json({ pages: blobData.pages })
  }

  // 2. Try database
  const dbPages = await safeDb(
    () =>
      prisma.guidePage.findMany({
        where: { guideId },
        orderBy: { pageNumber: 'asc' },
        select: {
          pageNumber: true,
          imagePath: true,
          thumbnailPath: true,
          width: true,
          height: true,
        },
      }),
    null
  )

  if (dbPages && dbPages.length > 0) {
    return NextResponse.json({
      pages: dbPages.map(p => ({
        pageNumber: p.pageNumber,
        imagePath: p.imagePath,
        thumbnailPath: p.thumbnailPath || p.imagePath,
        width: p.width || 1200,
        height: p.height || 1697,
      })),
    })
  }

  // 3. Try in-memory character store (pages stored inline)
  const characters = getStoredCharacters()
  for (const char of characters) {
    if (!char.guides) continue
    const guide = (char.guides as any[]).find(g => g.id === guideId)
    if (guide && guide.pages && guide.pages.length > 0) {
      return NextResponse.json({ pages: guide.pages })
    }
  }

  return NextResponse.json({ pages: [] })
}
