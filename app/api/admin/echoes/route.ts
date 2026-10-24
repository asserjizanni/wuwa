import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('q') || ''
    const cost = searchParams.get('cost')

    const where: any = {}
    if (cost) {
      where.cost = Number(cost)
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const echoes = await prisma.echo.findMany({
      where,
      orderBy: [{ cost: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json(echoes)
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
      echoClass,
      cost,
      iconUrl,
      cooldown,
      description,
      descriptionAr,
      sonataSets,
      isPublished,
    } = data

    if (!name || !slug) {
      return NextResponse.json({ error: 'الاسم والمعرف مطلوبان' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-')

    const created = await prisma.echo.create({
      data: {
        name,
        nameAr: nameAr || null,
        slug: cleanSlug,
        echoClass: echoClass || 'Common',
        cost: Number(cost) || 1,
        iconUrl: iconUrl || null,
        cooldown: cooldown ? Number(cooldown) : null,
        description: description || null,
        descriptionAr: descriptionAr || null,
        sonataSets: Array.isArray(sonataSets) ? sonataSets : [],
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
      echoClass,
      cost,
      iconUrl,
      cooldown,
      description,
      descriptionAr,
      sonataSets,
      isPublished,
    } = data

    if (!id) {
      return NextResponse.json({ error: 'معرف الإيكو مطلوب' }, { status: 400 })
    }

    const cleanSlug = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-') : undefined

    const updated = await prisma.echo.update({
      where: { id },
      data: {
        name,
        nameAr: nameAr || null,
        slug: cleanSlug,
        echoClass: echoClass || undefined,
        cost: cost ? Number(cost) : undefined,
        iconUrl: iconUrl || null,
        cooldown: cooldown ? Number(cooldown) : null,
        description: description || null,
        descriptionAr: descriptionAr || null,
        sonataSets: Array.isArray(sonataSets) ? sonataSets : undefined,
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

    await prisma.echo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
