import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { prisma, safeDb } from '@/lib/db'
import CharacterDetailClient from './CharacterDetailClient'
import { getStoredCharacters, getStoredCharacter } from '@/lib/data/characterStore'

interface Props {
  params: { slug: string }
}

const getCharacterWithGuide = cache(async (slug: string) => {
  const char = await safeDb(
    () =>
      prisma.character.findUnique({
        where: { slug, isPublished: true },
        select: {
          id: true,
          name: true,
          slug: true,
          element: true,
          weaponType: true,
          rarity: true,
          portraitPath: true,
          backgroundPath: true,
          description: true,
          guides: {
            where: { isActive: true, status: 'PUBLISHED' },
            select: {
              id: true,
              title: true,
              version: true,
              pageCount: true,
              publishedAt: true,
              pages: {
                select: {
                  id: true,
                  pageNumber: true,
                  imagePath: true,
                  thumbnailPath: true,
                  width: true,
                  height: true,
                },
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
  return getStoredCharacter(slug)
})

const getRelatedCharacters = cache(async (characterId: string, element: string, weaponType: string) => {
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

  return getStoredCharacters()
    .filter(c => c.isPublished && c.id !== characterId && (c.element === element || c.weaponType === weaponType))
    .slice(0, 4)
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const character = await getCharacterWithGuide(params.slug)

  if (!character) {
    return { title: 'الشخصية غير موجودة' }
  }

  return {
    title: `دليل بناء ${character.name}`,
    description: character.description || `دليل بناء شامل، وأطقم Echoes، والأسلحة، والفرق لشخصية ${character.name} في Wuthering Waves.`,
    openGraph: {
      title: `${character.name} — دليل بناء Wuthering Waves`,
      description: character.description || `استعرض دليل البناء الشامل لشخصية ${character.name}.`,
    },
  }
}

export const revalidate = 3600

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
