import type { Metadata } from 'next'
import HeroSection from '@/components/homepage/HeroSection'
import FeaturedCharacters from '@/components/homepage/FeaturedCharacters'
import ElementExplorer from '@/components/homepage/ElementExplorer'
import LatestBuilds from '@/components/homepage/LatestBuilds'
import BuilderFeature from '@/components/homepage/BuilderFeature'
import { prisma, safeDb } from '@/lib/db'
import { getStoredCharacters } from '@/lib/data/characterStore'

export const metadata: Metadata = {
  title: 'Wuthering Waves Builds — أدلة الشخصيات والبِلدات | وذرينق ويفز العربية',
  description: 'منصة مجتمعية لعرض أدلة الشخصيات والبِلدات. استعرض أحدث بنيات Resonators في Wuthering Waves، وتوزيع Echoes، ومحاكي WuwaFlex المدمج.',
  openGraph: {
    title: 'Wuthering Waves Builds — وذرينق ويفز العربية',
    description: 'منصة مجتمعية لعرض أدلة الشخصيات والبِلدات.',
  },
}

async function getFeaturedCharacters() {
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
          portraitPath: true,
          isFeatured: true,
          guides: {
            where: { status: 'PUBLISHED', isActive: true },
            select: { id: true, title: true, pageCount: true },
            take: 1,
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        take: 8,
      }),
    null
  )

  if (list !== null) return list
  return getStoredCharacters().filter(c => c.isPublished).slice(0, 8)
}

async function getLatestBuilds() {
  const list = await safeDb(
    () =>
      prisma.buildGuide.findMany({
        where: {
          status: 'PUBLISHED',
          isActive: true,
          character: { isPublished: true },
        },
        select: {
          id: true,
          title: true,
          version: true,
          pageCount: true,
          publishedAt: true,
          character: {
            select: { name: true, slug: true, element: true, portraitPath: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),
    null
  )

  if (list !== null) return list

  return getStoredCharacters()
    .filter(c => c.isPublished)
    .flatMap(c =>
      (c.guides || []).map(g => ({
        id: g.id,
        title: g.title,
        version: g.version,
        pageCount: g.pageCount,
        publishedAt: g.publishedAt,
        character: {
          name: c.name,
          slug: c.slug,
          element: c.element,
          portraitPath: c.portraitPath,
        },
      }))
    )
    .slice(0, 6)
}

export const revalidate = 3600

export default async function HomePage() {
  const [featured, latestBuilds] = await Promise.all([
    getFeaturedCharacters(),
    getLatestBuilds(),
  ])

  return (
    <>
      <HeroSection />
      <FeaturedCharacters characters={featured as any[]} />
      <ElementExplorer />
      <LatestBuilds guides={latestBuilds as any[]} />
      <BuilderFeature />
    </>
  )
}
