import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { WeaponType, Rarity, Element } from '@prisma/client'

function mapWeaponType(wt: string): WeaponType {
  const upper = (wt || '').toUpperCase()
  if (upper.includes('BROADBLADE')) return WeaponType.BROADBLADE
  if (upper.includes('SWORD')) return WeaponType.SWORD
  if (upper.includes('PISTOL')) return WeaponType.PISTOLS
  if (upper.includes('GAUNTLET')) return WeaponType.GAUNTLETS
  if (upper.includes('RECTIFIER')) return WeaponType.RECTIFIER
  return WeaponType.SWORD
}

function mapElement(elem: string): Element {
  const upper = (elem || '').toUpperCase()
  if (upper.includes('AERO')) return Element.AERO
  if (upper.includes('SPECTRO')) return Element.SPECTRO
  if (upper.includes('FUSION')) return Element.FUSION
  if (upper.includes('ELECTRO')) return Element.ELECTRO
  if (upper.includes('GLACIO')) return Element.GLACIO
  if (upper.includes('HAVOC')) return Element.HAVOC
  return Element.SPECTRO
}

function mapRarity(r: any): Rarity {
  if (r === 5 || r === '5' || r === 'FIVE_STAR') return Rarity.FIVE_STAR
  if (r === 4 || r === '4' || r === 'FOUR_STAR') return Rarity.FOUR_STAR
  if (r === 3 || r === '3' || r === 'THREE_STAR') return Rarity.THREE_STAR
  if (r === 2 || r === '2' || r === 'TWO_STAR') return Rarity.TWO_STAR
  return Rarity.ONE_STAR
}

export async function POST(req: NextRequest) {
  try {
    const { category, records } = await req.json()

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'السجلات غير صالحة أو فارغة' }, { status: 400 })
    }

    let importedCount = 0

    if (category === 'weapons') {
      const formatted = records.map((w: any) => {
        const slug = String(w.slug || w.id || w.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        let descEn = ''
        let descAr = ''
        if (typeof w.desc === 'string') descEn = w.desc
        else if (w.desc && typeof w.desc === 'object') {
          descEn = typeof w.desc.en === 'string' ? w.desc.en : w.desc.en?.['5'] || ''
          descAr = typeof w.desc.ar === 'string' ? w.desc.ar : w.desc.ar?.['5'] || ''
        }

        return {
          slug,
          name: w.name,
          nameAr: w.nameAr || null,
          weaponType: mapWeaponType(w.type || w.weaponType),
          rarity: mapRarity(w.rarity || w.stars),
          stars: Number(w.rarity || w.stars) || 4,
          iconUrl: w.image || w.iconUrl || null,
          imageBig: w.imagebig || null,
          desc: descEn || null,
          descAr: descAr || null,
          buffs: w.buffs || null,
          isPublished: true,
        }
      })

      const res = await prisma.weapon.createMany({
        data: formatted,
        skipDuplicates: true,
      })
      importedCount = res.count
    } else if (category === 'echoes') {
      const formatted = records.map((ec: any) => ({
        slug: String(ec.slug || ec.id),
        name: ec.name,
        nameAr: ec.nameAr || null,
        echoClass: ec.class || ec.echoClass || 'Common',
        cost: Number(ec.cost) || 1,
        iconUrl: ec.image || ec.iconUrl || null,
        cooldown: ec.cooldown ? Number(ec.cooldown) : null,
        description: ec.description || null,
        descriptionAr: ec.descriptionAr || null,
        sonataSets: ec.sets ? (Array.isArray(ec.sets) ? ec.sets : [ec.sets]) : [],
        isPublished: true,
      }))

      const res = await prisma.echo.createMany({
        data: formatted,
        skipDuplicates: true,
      })
      importedCount = res.count
    } else if (category === 'enemies') {
      const formatted = records.map((en: any) => ({
        slug: String(en.slug || en.id),
        name: en.name,
        nameAr: en.nameAr || null,
        enemyClass: en.enemyClass || 'Common',
        elements: en.elements || [],
        hp: en.hp || null,
        atk: en.atk || null,
        def: en.def || null,
        description: en.description || null,
        descriptionAr: en.descriptionAr || en.description || null,
        iconUrl: en.image || en.iconUrl || null,
        detailUrl: en.detailUrl || null,
        isPublished: true,
      }))

      const res = await prisma.enemy.createMany({
        data: formatted,
        skipDuplicates: true,
      })
      importedCount = res.count
    } else if (category === 'sonataSets') {
      const formatted = records.map((s: any) => ({
        slug: String(s.slug || s.id),
        name: s.name,
        nameAr: s.nameAr || null,
        iconUrl: s.image || s.iconUrl || null,
        twoPieceEffect: s.twoPieceEffect || '',
        twoPieceEffectAr: s.twoPieceEffectAr || null,
        fivePieceEffect: s.fivePieceEffect || '',
        fivePieceEffectAr: s.fivePieceEffectAr || null,
      }))

      const res = await prisma.sonataSet.createMany({
        data: formatted,
        skipDuplicates: true,
      })
      importedCount = res.count
    } else if (category === 'characters') {
      for (const char of records) {
        const slug = String(char.slug || char.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        await prisma.character.upsert({
          where: { slug },
          update: {
            name: char.name,
            nameAr: char.nameAr || null,
            element: mapElement(char.element),
            weaponType: mapWeaponType(char.weaponType || char.weapon),
            rarity: mapRarity(char.rarity || char.stars),
            portraitPath: char.portraitPath || char.image || null,
            description: char.description || null,
            role: char.role || 'DPS',
            isPublished: char.isPublished ?? true,
          },
          create: {
            slug,
            name: char.name,
            nameAr: char.nameAr || null,
            element: mapElement(char.element),
            weaponType: mapWeaponType(char.weaponType || char.weapon),
            rarity: mapRarity(char.rarity || char.stars),
            portraitPath: char.portraitPath || char.image || null,
            description: char.description || null,
            role: char.role || 'DPS',
            isPublished: char.isPublished ?? true,
          },
        })
        importedCount++
      }
    }

    return NextResponse.json({ success: true, imported: importedCount, category })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
