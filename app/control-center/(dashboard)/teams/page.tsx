import { prisma } from '@/lib/db'
import TeamsAdminClient from './TeamsAdminClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TeamsAdminPage() {
  const [teams, characters, weapons] = await Promise.all([
    prisma.teamComp.findMany({
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    }).catch(() => []),
    prisma.character.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        element: true,
        portraitPath: true,
      },
      orderBy: { name: 'asc' },
    }).catch(() => []),
    prisma.weapon.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        iconUrl: true,
        weaponType: true,
        rarity: true,
      },
      orderBy: { name: 'asc' },
    }).catch(() => []),
  ])

  return <TeamsAdminClient initialTeams={teams} characters={characters} weapons={weapons} />
}
