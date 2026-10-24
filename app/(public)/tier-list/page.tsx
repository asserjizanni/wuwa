import { Metadata } from 'next'
import { prisma, safeDb } from '@/lib/db'
import TierListClient from './TierListClient'

export const metadata: Metadata = {
  title: 'تصنيف الشخصيات (Tier List) | Wuthering Waves',
  description: 'قائمة تصنيف أفضل شخصيات ووذيرينغ ويفز للإصدار الحالي، مع تفصيل الأدوار في برج الشدائد ومواجهات العالم المفتوح.',
}

export const revalidate = 60

export default async function TierListPage() {
  const [tierLists, characters] = await Promise.all([
    safeDb(
      () =>
        prisma.tierList.findMany({
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
        }),
      [],
      3500,
      'tierlist:list',
      300
    ),
    safeDb(
      () =>
        prisma.character.findMany({
          select: {
            slug: true,
            name: true,
            nameAr: true,
            element: true,
            weaponType: true,
            rarity: true,
          },
        }),
      [],
      3500,
      'characters:for_tierlist',
      300
    ),
  ])

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" dir="rtl">
      <TierListClient tierLists={tierLists as any[]} characters={characters as any[]} />
    </main>
  )
}
