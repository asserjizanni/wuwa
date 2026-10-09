import type { Metadata } from 'next'
import HeroSection from '@/components/homepage/HeroSection'
import FeaturedCharacters from '@/components/homepage/FeaturedCharacters'
import ElementExplorer from '@/components/homepage/ElementExplorer'
import LatestBuilds from '@/components/homepage/LatestBuilds'
import BuilderFeature from '@/components/homepage/BuilderFeature'
import { prisma, safeDb } from '@/lib/db'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'

export const metadata: Metadata = {
  title: 'Wuthering Waves Builds — أدلة الشخصيات والبِلدات | وذرينق ويفز العربية',
  description: 'منصة مجتمعية لعرض أدلة الشخصيات والبِلدات. استعرض أحدث بنيات رنّاني Wuthering Waves، وتوزيع الصدى، ومحاكي WuwaFlex المدمج.',
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
        include: {
          guides: {
            where: { status: 'PUBLISHED', isActive: true },
            select: { id: true, title: true, pageCount: true },
            take: 1,
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        take: 8,
      }),
    []
  )

  if (list && list.length > 0) return list
  return FALLBACK_CHARACTERS.slice(0, 8)
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
        include: {
          character: {
            select: { name: true, slug: true, element: true, portraitPath: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),
    []
  )

  if (list && list.length > 0) return list

  return FALLBACK_CHARACTERS.flatMap(c =>
    c.guides.map(g => ({
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
  ).slice(0, 6)
}

export const revalidate = 60

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
