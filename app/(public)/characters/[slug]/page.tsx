import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { prisma, safeDb } from '@/lib/db'
import CharacterDetailClient from './CharacterDetailClient'
import { getStoredCharacters, getStoredCharacter } from '@/lib/data/characterStore'
import { getCleanCharacterBySlug } from '@/lib/data/characterCleanData'

interface Props {
  params: Promise<{ slug: string }>
}

const SLUG_ALIASES: Record<string, string> = {
  'shorekeeper': 'the-shorekeeper',
  'jinhsi': 'jinshi',
  'camellya': 'camellia',
  'zhezhi': 'zhezi',
  'xuanling': 'yangyang-xuanling',
  'luukherssen': 'luuk',
  'lucy': 'luce',
  'aemeath': 'aemeth',
  'roccia': 'boccia',
  'rover-havoc': 'rover',
  'rover-spectro': 'rover',
  'rover-aero': 'rover',
  'rover-electro': 'rover',
  'rover-glacio': 'rover',
  'rover-fusion': 'rover',
  'the-shorekeeper': 'shorekeeper',
  'jinshi': 'jinhsi',
  'camellia': 'camellya',
  'zhezi': 'zhezhi',
  'yangyang-xuanling': 'xuanling',
  'luuk': 'luukherssen',
  'luce': 'lucy',
  'aemeth': 'aemeath',
  'boccia': 'roccia',
}

const getCharacterWithGuide = cache(async (slug: string) => {
  if (!slug) return null

  const targetSlugs = [slug, SLUG_ALIASES[slug.toLowerCase()]].filter(Boolean) as string[]

  for (const s of targetSlugs) {
    const char = await safeDb(
      () =>
        prisma.character.findUnique({
          where: { slug: s },
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            element: true,
            weaponType: true,
            rarity: true,
            portraitPath: true,
            backgroundPath: true,
            description: true,
            descriptionAr: true,
            role: true,
            isPublished: true,
            isComingSoon: true,
            releaseVersion: true,
            stats: true,
            skills: true,
            ascensionMaterials: true,
            skillMaterials: true,
            recommendedWeapons: true,
            recommendedEchoes: true,
            teamComps: true,
            buildTips: true,
          },
        }),
      null,
      1200,
      `char:detail:${s}`,
      300
    )

    if (char) return char
    const stored = getStoredCharacter(s)
    if (stored) return stored
  }

  return null
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
          id: true,
          name: true,
          nameAr: true,
          slug: true,
          element: true,
          weaponType: true,
          rarity: true,
          portraitPath: true,
          isPublished: true,
        },
        take: 4,
        orderBy: { name: 'asc' },
      }),
    [],
    800,
    `char:related:${element}:${weaponType}`,
    600
  )

  if (list && list.length > 0) return list

  return getStoredCharacters()
    .filter(c => c.isPublished && c.id !== characterId && (c.element === element || c.weaponType === weaponType))
    .slice(0, 4)
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams?.slug
  const character = slug ? await getCharacterWithGuide(slug) : null

  if (!character) {
    return { title: 'الشخصية غير موجودة' }
  }

  const displayName = character.nameAr || character.name

  return {
    title: `دليل وبناء ${displayName} (${character.name}) — Wuthering Waves`,
    description: character.descriptionAr || character.description || `دليل بناء شامل، وأطقم Echoes، والأسلحة، والفرق لشخصية ${displayName} في Wuthering Waves.`,
    openGraph: {
      title: `${displayName} (${character.name}) — دليل وبناء Wuthering Waves`,
      description: character.descriptionAr || character.description || `استعرض دليل البناء الشامل لشخصية ${displayName}.`,
    },
  }
}

export async function generateStaticParams() {
  const characters = getStoredCharacters()
  return characters.map(c => ({
    slug: c.slug,
  }))
}

export const revalidate = 3600

export default async function CharacterPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams?.slug

  if (!slug) {
    notFound()
  }

  const rawCharacter = await getCharacterWithGuide(slug)

  if (!rawCharacter) {
    notFound()
  }

  const clean = getCleanCharacterBySlug(rawCharacter.slug || slug)

  // Extract skills and sequences cleanly
  const rawSkills = rawCharacter.skills as any
  const talents = Array.isArray(rawSkills) 
    ? rawSkills 
    : (rawSkills?.talents || clean?.talents || [])
    
  const sequences = (rawCharacter as any).sequences 
    || rawSkills?.sequences 
    || clean?.sequences 
    || []

  const rawStats = (rawCharacter.stats as any) || {}
  const stats = rawCharacter.stats || clean?.stats || null
  const ascensionMaterials = rawCharacter.ascensionMaterials || clean?.ascensionMaterials || clean?.materials || []
  const skillMaterials = (rawCharacter as any).skillMaterials || clean?.skillMaterials || []
  const allMaterials = (rawCharacter as any).allMaterials || rawStats?.allMaterials || clean?.allMaterials || []
  const teams = (rawCharacter as any).teams || (rawCharacter as any).teamComps || clean?.teams || []
  const teamComps = clean?.synergies || (rawCharacter as any).synergies || []
  const recommendedEchoes = rawCharacter.recommendedEchoes || (clean as any)?.recommendedEchoes || null
  const weaponsDPS = (rawCharacter as any).weaponsDPS || (rawCharacter as any).recommendedWeapons || clean?.weaponsDPS || []
  const damageDistribution = (rawCharacter as any).damageDistribution || rawStats?.damageDistribution || clean?.damageDistribution || null

  const character = {
    ...rawCharacter,
    nameAr: rawCharacter.nameAr || clean?.nameAr,
    role: rawCharacter.role || clean?.role,
    descriptionAr: rawCharacter.descriptionAr || clean?.summary || clean?.lede,
    stats,
    skills: talents,
    sequences,
    ascensionMaterials,
    skillMaterials,
    allMaterials,
    teams,
    teamComps,
    recommendedEchoes,
    weaponsDPS,
    damageDistribution,
  }

  // Run related characters fetch in parallel (non-blocking for page render)
  const related = await getRelatedCharacters(character.id, character.element, character.weaponType)

  return (
    <CharacterDetailClient
      character={character as any}
      relatedCharacters={(related || []) as any[]}
    />
  )
}
