import { prisma } from '@/lib/db'
import TierListsAdminClient from './TierListsAdminClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TierListsAdminPage() {
  const [tierLists, characters] = await Promise.all([
    prisma.tierList.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
    prisma.character.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        element: true,
        portraitPath: true,
        rarity: true,
      },
      orderBy: { name: 'asc' },
    }).catch(() => []),
  ])

  return <TierListsAdminClient initialTierLists={tierLists} characters={characters} />
}
