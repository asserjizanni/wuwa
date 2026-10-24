import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const teams = await prisma.teamComp.findMany({
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ teams })
  } catch (err: any) {
    console.error('[teams GET]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, title, titleAr, description, descriptionAr, members, rotationGuide, rotationGuideAr, isFeatured, isPublished } = body

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title required' }, { status: 400 })
    }

    const team = await prisma.teamComp.upsert({
      where: { slug },
      update: {
        title,
        titleAr,
        description,
        descriptionAr,
        members: members || [],
        rotationGuide,
        rotationGuideAr,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        isPublished: isPublished !== undefined ? isPublished : true,
      },
      create: {
        slug,
        title,
        titleAr,
        description,
        descriptionAr,
        members: members || [],
        rotationGuide,
        rotationGuideAr,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    })

    return NextResponse.json({ team })
  } catch (err: any) {
    console.error('[teams POST]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.teamComp.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
