import type { Metadata } from 'next'
import { Suspense } from 'react'
import HeroSection from '@/components/homepage/HeroSection'
import DatabaseDirectory from '@/components/homepage/DatabaseDirectory'
import FeaturedCharacters from '@/components/homepage/FeaturedCharacters'
import ElementExplorer from '@/components/homepage/ElementExplorer'
import LatestBuilds from '@/components/homepage/LatestBuilds'
import BuilderFeature from '@/components/homepage/BuilderFeature'
import { prisma, safeDb } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Wuthering Waves Builds — أدلة وبِلدات وذرينق ويفز العربية',
  description: 'الموسوعة العربية الشاملة للعبة Wuthering Waves: أدلة الشخصيات، البِلدات، الأسلحة، الإيكو، الأعداء، التيرلست وفرق القتال.',
  openGraph: {
    title: 'Wuthering Waves Builds — وذرينق ويفز العربية',
    description: 'الموسوعة العربية الشاملة للعبة Wuthering Waves: أدلة الشخصيات، البِلدات، الأسلحة، الإيكو، الأعداء، والتيرلست.',
    siteName: 'Wuthering Waves Builds',
  },
}

export const revalidate = 3600

async function getFeaturedCharacters() {
  const list = await safeDb(
    () =>
      prisma.character.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          name: true,
          nameAr: true,
          slug: true,
          element: true,
          weaponType: true,
          rarity: true,
          role: true,
          isFeatured: true,
          isPublished: true,
          sortOrder: true,
          description: true,
          descriptionAr: true,
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        take: 8,
      }),
    [],
    1200,
    'home:featured_characters',
    600
  )

  return (list || []).map(c => ({
    ...c,
    portraitPath: `/images/characters/${c.slug}.webp`,
  }))
}

async function getLatestBuilds() {
  return []
}

export default async function HomePage() {
  const [featured, latestBuilds] = await Promise.all([
    getFeaturedCharacters(),
    getLatestBuilds(),
  ])

  return (
    <>
      <HeroSection />
      <DatabaseDirectory />
      <Suspense fallback={<div className="h-64" />}>
        <FeaturedCharacters characters={featured as any[]} />
      </Suspense>
      <ElementExplorer />
      <LatestBuilds guides={latestBuilds as any[]} />
      <BuilderFeature />
    </>
  )
}
