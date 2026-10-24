import type { Metadata } from 'next'
import { prisma, safeDb } from '@/lib/db'
import { getStoredCharacters } from '@/lib/data/characterStore'
import CharacterSpinClient, { SpinCharacter } from './CharacterSpinClient'

export const metadata: Metadata = {
  title: 'عجلة الحظ وسحب الشخصيات — Wuthering Waves Builds',
  description:
    'عجلة الحظ التفاعلية لشخصيات Wuthering Waves. جرّب حظك الآن واحصل على Resonator عشوائي مع استعراض بنيات وعتاد الشخصية.',
}

export const revalidate = 3600

async function getSpinCharacters(): Promise<SpinCharacter[]> {
  const list = await safeDb(
    () =>
      prisma.character.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          name: true,
          slug: true,
          element: true,
          weaponType: true,
          rarity: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    null
  )

  if (list !== null) {
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      element: c.element,
      weaponType: c.weaponType,
      rarity: c.rarity,
      portraitPath: `/images/characters/${c.slug}.webp`,
      hasGuide: true,
    }))
  }

  // Fallback to offline store
  const stored = getStoredCharacters().filter((c) => c.isPublished)
  return stored.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    element: c.element,
    weaponType: c.weaponType,
    rarity: c.rarity,
    portraitPath: c.portraitPath,
    hasGuide: (c.guides?.length || 0) > 0,
  }))
}

export default async function SpinPage() {
  const characters = await getSpinCharacters()

  return <CharacterSpinClient characters={characters} />
}
