import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() || ''

  if (!q || q.length < 2) {
    return NextResponse.json({ characters: [] })
  }

  const characters = await safeDb(
    () =>
      prisma.character.findMany({
        where: {
          isPublished: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q.toLowerCase(), mode: 'insensitive' } },
          ],
        },
        include: {
          guides: {
            where: { status: 'PUBLISHED', isActive: true },
            select: { id: true, title: true, pageCount: true },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
        take: 20,
      }),
    []
  )

  if (characters && characters.length > 0) {
    return NextResponse.json({ characters })
  }

  // Fallback search
  const lowerQ = q.toLowerCase()
  const matched = FALLBACK_CHARACTERS.filter(c =>
    c.name.toLowerCase().includes(lowerQ) ||
    c.nameEn.toLowerCase().includes(lowerQ) ||
    c.slug.includes(lowerQ)
  ).slice(0, 20)

  return NextResponse.json({ characters: matched })
}
