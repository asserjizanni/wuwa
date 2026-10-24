import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('q') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const sets = await prisma.sonataSet.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(sets)
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
      iconUrl,
      twoPieceEffect,
      twoPieceEffectAr,
      fivePieceEffect,
      fivePieceEffectAr,
    } = data

    if (!name || !slug) {
      return NextResponse.json({ error: 'الاسم والمعرف مطلوبان' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-')

    const created = await prisma.sonataSet.create({
      data: {
        name,
        nameAr: nameAr || null,
        slug: cleanSlug,
        iconUrl: iconUrl || null,
        twoPieceEffect: twoPieceEffect || null,
        twoPieceEffectAr: twoPieceEffectAr || null,
        fivePieceEffect: fivePieceEffect || null,
        fivePieceEffectAr: fivePieceEffectAr || null,
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
      iconUrl,
      twoPieceEffect,
      twoPieceEffectAr,
      fivePieceEffect,
      fivePieceEffectAr,
    } = data

    if (!id) {
      return NextResponse.json({ error: 'معرف الطقم مطلوب' }, { status: 400 })
    }

    const cleanSlug = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-') : undefined

    const updated = await prisma.sonataSet.update({
      where: { id },
      data: {
        name,
        nameAr: nameAr || null,
        slug: cleanSlug,
        iconUrl: iconUrl || null,
        twoPieceEffect: twoPieceEffect || null,
        twoPieceEffectAr: twoPieceEffectAr || null,
        fivePieceEffect: fivePieceEffect || null,
        fivePieceEffectAr: fivePieceEffectAr || null,
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

    await prisma.sonataSet.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
