import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getStoredCharacters } from '@/lib/data/characterStore'

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
        select: {
          id: true,
          name: true,
          slug: true,
          element: true,
          weaponType: true,
          rarity: true,
          portraitPath: true,
        },
        orderBy: { name: 'asc' },
        take: 12,
      }),
    []
  )

  if (characters && characters.length > 0) {
    return NextResponse.json({ characters })
  }

  // Fallback search from persistent store
  const lowerQ = q.toLowerCase()
  const matched = getStoredCharacters().filter(c =>
    c.isPublished && (
      c.name.toLowerCase().includes(lowerQ) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(lowerQ)) ||
      c.slug.includes(lowerQ)
    )
  ).slice(0, 20)

  return NextResponse.json({ characters: matched })
}
