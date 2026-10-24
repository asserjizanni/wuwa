import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('q') || ''
    const enemyClass = searchParams.get('class')

    const where: any = {}
    if (enemyClass) {
      where.enemyClass = enemyClass
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const enemies = await prisma.enemy.findMany({
      where,
      orderBy: [{ enemyClass: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(enemies)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const {
      name,
      nameAr,
      slug,
      enemyClass,
      elements,
      hp,
      atk,
      def,
      description,
      descriptionAr,
      iconUrl,
      artworkUrl,
      isPublished,
    } = data

    if (!name || !slug) {
      return NextResponse.json({ error: 'الاسم والمعرف مطلوبان' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-')

    const created = await prisma.enemy.create({
      data: {
        name,
        nameAr: nameAr || null,
        slug: cleanSlug,
        enemyClass: enemyClass || 'Common',
        elements: Array.isArray(elements) ? elements : [],
        hp: hp ? Number(hp) : null,
        atk: atk ? Number(atk) : null,
        def: def ? Number(def) : null,
        description: description || null,
        descriptionAr: descriptionAr || null,
        iconUrl: iconUrl || null,
        artworkUrl: artworkUrl || null,
        isPublished: isPublished ?? true,
      },
    })

    return NextResponse.json(created)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const {
      id,
      name,
      nameAr,
      slug,
      enemyClass,
      elements,
      hp,
      atk,
      def,
      description,
      descriptionAr,
      iconUrl,
      artworkUrl,
      isPublished,
    } = data

    if (!id) {
      return NextResponse.json({ error: 'معرف العدو مطلوب' }, { status: 400 })
    }

    const cleanSlug = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-') : undefined

    const updated = await prisma.enemy.update({
      where: { id },
      data: {
        name,
        nameAr: nameAr || null,
        slug: cleanSlug,
        enemyClass: enemyClass || undefined,
        elements: Array.isArray(elements) ? elements : undefined,
        hp: hp !== undefined ? (hp ? Number(hp) : null) : undefined,
        atk: atk !== undefined ? (atk ? Number(atk) : null) : undefined,
        def: def !== undefined ? (def ? Number(def) : null) : undefined,
        description: description || null,
        descriptionAr: descriptionAr || null,
        iconUrl: iconUrl || null,
        artworkUrl: artworkUrl || null,
        isPublished: isPublished ?? true,
      },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    }

    await prisma.enemy.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
