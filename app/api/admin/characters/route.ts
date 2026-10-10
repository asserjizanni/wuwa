import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import { generateSlug, initCharacterStorage } from '@/lib/storage'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'
import { getStoredCharacters, createStoredCharacter } from '@/lib/data/characterStore'
import { z } from 'zod'

const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  element: z.enum(['AERO', 'SPECTRO', 'FUSION', 'ELECTRO', 'GLACIO', 'HAVOC']),
  weaponType: z.enum(['BROADBLADE', 'SWORD', 'PISTOLS', 'GAUNTLETS', 'RECTIFIER']),
  rarity: z.enum(['FOUR_STAR', 'FIVE_STAR']).default('FIVE_STAR'),
  description: z.string().max(2000).optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const element = searchParams.get('element') || ''
  const published = searchParams.get('published')

  const result = await safeDb(async () => {
    const where: any = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (element) where.element = element
    if (published === 'true') where.isPublished = true
    if (published === 'false') where.isPublished = false

    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        include: {
          guides: {
            select: { id: true, status: true, isActive: true, pageCount: true, publishedAt: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          _count: { select: { guides: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.character.count({ where }),
    ])

    return {
      characters,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }, null)

  if (result) {
    return NextResponse.json(result)
  }

  // Fallback characters from persistent store
  let list = [...getStoredCharacters()]
  if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  if (element) list = list.filter(c => c.element === element)
  if (published === 'true') list = list.filter(c => c.isPublished === true)
  if (published === 'false') list = list.filter(c => c.isPublished === false)
  const total = list.length
  const paginated = list.slice((page - 1) * limit, page * limit).map(c => ({
    ...c,
    _count: { guides: c.guides ? c.guides.length : 0 },
  }))

  return NextResponse.json({
    characters: paginated,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Sanitize: fallback session ID is not a real DB cuid — use null for audit log
  const auditAdminId = session.adminId && session.adminId !== 'admin-system-master' ? session.adminId : null

  try {
    const body = await request.json()
    const data = createCharacterSchema.parse(body)

    const slug = data.slug || generateSlug(data.name)

    const existing = await safeDb(() => prisma.character.findUnique({ where: { slug } }), null)
    if (existing) {
      return NextResponse.json(
        { error: `Slug "${slug}" is already in use`, field: 'slug' },
        { status: 409 }
      )
    }

    const character = await safeDb(async () => {
      return prisma.$transaction(async (tx) => {
        const char = await tx.character.create({
          data: {
            name: data.name,
            slug,
            element: data.element,
            weaponType: data.weaponType,
            rarity: data.rarity,
            description: data.description || null,
            sourceUrl: data.sourceUrl || null,
            isPublished: data.isPublished,
            isFeatured: data.isFeatured,
            tags: data.tags,
          },
        })

        await tx.auditLog.create({
          data: {
            adminUserId: auditAdminId,
            action: 'CREATE_CHARACTER',
            targetType: 'Character',
            targetId: char.id,
            details: { name: char.name, slug: char.slug },
          },
        })

        return char
      })
    }, null)

    try {
      await initCharacterStorage(slug)
    } catch (storageErr) {
      console.error('[storage] Failed to create directories for', slug, storageErr)
    }

    if (character) {
      // Also sync to local store
      createStoredCharacter({
        ...data,
        slug,
      })
      return NextResponse.json({ character }, { status: 201 })
    }

    // Fallback store when DB is offline
    const fallbackChar = createStoredCharacter({
      ...data,
      slug,
    })

    return NextResponse.json({ character: fallbackChar }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 422 })
    }
    console.error('[create character]', err)
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
}
