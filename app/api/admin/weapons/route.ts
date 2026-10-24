import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { WeaponType, Rarity } from '@prisma/client'

function mapWeaponType(wt: string): WeaponType {
  const upper = (wt || '').toUpperCase()
  if (upper.includes('BROADBLADE')) return WeaponType.BROADBLADE
  if (upper.includes('SWORD')) return WeaponType.SWORD
  if (upper.includes('PISTOL')) return WeaponType.PISTOLS
  if (upper.includes('GAUNTLET')) return WeaponType.GAUNTLETS
  if (upper.includes('RECTIFIER')) return WeaponType.RECTIFIER
  return WeaponType.SWORD
}

function mapRarity(stars: number): Rarity {
  if (stars === 5) return Rarity.FIVE_STAR
  if (stars === 4) return Rarity.FOUR_STAR
  if (stars === 3) return Rarity.THREE_STAR
  if (stars === 2) return Rarity.TWO_STAR
  return Rarity.ONE_STAR
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const weaponType = searchParams.get('weaponType') || ''
    const limit = parseInt(searchParams.get('limit') || '200')

    const weapons = await prisma.weapon.findMany({
      where: {
        isPublished: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { nameAr: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(weaponType ? { weaponType: mapWeaponType(weaponType) } : {}),
      },
      orderBy: [{ stars: 'desc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        weaponType: true,
        stars: true,
        iconUrl: true,
      },
    })

    return NextResponse.json({ weapons })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {

  try {
    const data = await req.json()
    const { name, nameAr, slug, weaponType, stars, iconUrl, baseAtk, secondaryStat, secondaryStatValue, desc, descAr, isPublished } = data

    if (!name || !slug) {
      return NextResponse.json({ error: 'الاسم والمعرف مطلوبان' }, { status: 400 })
    }

    const created = await prisma.weapon.create({
      data: {
        name,
        nameAr: nameAr || null,
        slug: slug.toLowerCase().trim(),
        weaponType: mapWeaponType(weaponType),
        rarity: mapRarity(Number(stars) || 4),
        stars: Number(stars) || 4,
        iconUrl: iconUrl || null,
        baseAtk: baseAtk ? Number(baseAtk) : null,
        secondaryStat: secondaryStat || null,
        secondaryStatValue: secondaryStatValue || null,
        desc: desc || null,
        descAr: descAr || null,
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
    const { id, name, nameAr, slug, weaponType, stars, iconUrl, baseAtk, secondaryStat, secondaryStatValue, desc, descAr, isPublished } = data

    if (!id) {
      return NextResponse.json({ error: 'معرف السلاح مطلوب' }, { status: 400 })
    }

    const updated = await prisma.weapon.update({
      where: { id },
      data: {
        name,
        nameAr: nameAr || null,
        slug: slug?.toLowerCase().trim(),
        weaponType: weaponType ? mapWeaponType(weaponType) : undefined,
        rarity: stars ? mapRarity(Number(stars)) : undefined,
        stars: stars ? Number(stars) : undefined,
        iconUrl: iconUrl || null,
        baseAtk: baseAtk ? Number(baseAtk) : null,
        secondaryStat: secondaryStat || null,
        secondaryStatValue: secondaryStatValue || null,
        desc: desc || null,
        descAr: descAr || null,
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

    await prisma.weapon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
