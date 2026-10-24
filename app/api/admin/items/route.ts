import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const take = parseInt(searchParams.get('take') || '200')

    const items = await prisma.item.findMany({
      where: {
        isPublished: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { nameAr: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      take,
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        category: true,
        rarity: true,
        iconUrl: true,
      },
    })

    return NextResponse.json({ items })
  } catch (err: any) {
    console.error('[items GET]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, name, nameAr, category, rarity, iconUrl, description, source } = body

    const item = await prisma.item.upsert({
      where: { slug },
      update: { name, nameAr, category, rarity, iconUrl, description, source },
      create: { slug, name, nameAr, category: category || 'COMMON', rarity: rarity || 3, iconUrl, description, source, isPublished: true },
    })

    return NextResponse.json(item)
  } catch (err: any) {
    console.error('[items POST]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, iconUrl, ...rest } = body

    const item = await prisma.item.update({
      where: { id },
      data: { ...rest, ...(iconUrl !== undefined ? { iconUrl } : {}) },
    })

    return NextResponse.json(item)
  } catch (err: any) {
    console.error('[items PATCH]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.item.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
