import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma, safeDb } from '@/lib/db'
import CharacterDetailClient from './CharacterDetailClient'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const character = await safeDb(
    () =>
      prisma.character.findUnique({
        where: { slug: params.slug, isPublished: true },
        select: { name: true, element: true, weaponType: true, description: true },
      }),
    null
  ) || FALLBACK_CHARACTERS.find(c => c.slug === params.slug)

  if (!character) {
    return { title: 'الشخصية غير موجودة' }
  }

  return {
    title: `دليل بناء ${character.name}`,
    description: character.description || `دليل بناء شامل، وأطقم الصدى، والأسلحة، والفرق لشخصية ${character.name} في Wuthering Waves.`,
    openGraph: {
      title: `${character.name} — دليل بناء Wuthering Waves`,
      description: character.description || `استعرض دليل البناء الشامل لشخصية ${character.name}.`,
    },
  }
}

async function getCharacterWithGuide(slug: string) {
  const char = await safeDb(
    () =>
      prisma.character.findUnique({
        where: { slug, isPublished: true },
        include: {
          guides: {
            where: { isActive: true, status: 'PUBLISHED' },
            include: {
              pages: {
                orderBy: { pageNumber: 'asc' },
              },
            },
            take: 1,
          },
        },
      }),
    null
  )

  if (char) return char
  return FALLBACK_CHARACTERS.find(c => c.slug === slug) || null
}

async function getRelatedCharacters(characterId: string, element: string, weaponType: string) {
  const list = await safeDb(
    () =>
      prisma.character.findMany({
        where: {
          isPublished: true,
          id: { not: characterId },
          OR: [{ element: element as any }, { weaponType: weaponType as any }],
        },
        select: {
          id: true, name: true, slug: true, element: true, weaponType: true,
          rarity: true, portraitPath: true,
          guides: {
            where: { status: 'PUBLISHED', isActive: true },
            select: { id: true },
            take: 1,
          },
        },
        take: 4,
        orderBy: { name: 'asc' },
      }),
    []
  )

  if (list && list.length > 0) return list

  return FALLBACK_CHARACTERS
    .filter(c => c.id !== characterId && (c.element === element || c.weaponType === weaponType))
    .slice(0, 4)
}

export const revalidate = 60

export default async function CharacterPage({ params }: Props) {
  const character = await getCharacterWithGuide(params.slug)

  if (!character) {
    notFound()
  }

  const related = await getRelatedCharacters(character.id, character.element, character.weaponType)

  return (
    <CharacterDetailClient
      character={character as any}
      relatedCharacters={related as any[]}
    />
  )
}
