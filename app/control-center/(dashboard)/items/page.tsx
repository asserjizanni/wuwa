import { prisma } from '@/lib/db'
import ItemsAdminClient from './ItemsAdminClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ItemsAdminPage() {
  let items: any[] = []
  try {
    items = await prisma.item.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
  } catch {
    items = []
  }

  return <ItemsAdminClient initialItems={items} />
}
