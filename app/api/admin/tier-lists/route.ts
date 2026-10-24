import { NextRequest, NextResponse } from 'next/server'
import { prisma, clearDbCache } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const tierLists = await prisma.tierList.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ tierLists })
  } catch (err: any) {
    console.error('[tier-lists GET]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, title, titleAr, gameVersion, category, description, tiers, isPublished } = body

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title required' }, { status: 400 })
    }

    const tierList = await prisma.tierList.upsert({
      where: { slug },
      update: {
        title,
        titleAr,
        gameVersion: gameVersion || '1.4',
        category: category || 'overall',
        description,
        tiers: tiers || [],
        isPublished: isPublished !== undefined ? isPublished : true,
      },
      create: {
        slug,
        title,
        titleAr,
        gameVersion: gameVersion || '1.4',
        category: category || 'overall',
        description,
        tiers: tiers || [],
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    })

    clearDbCache('tierlist')
    return NextResponse.json({ tierList })
  } catch (err: any) {
    console.error('[tier-lists POST]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.tierList.delete({ where: { id } })
    clearDbCache('tierlist')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
