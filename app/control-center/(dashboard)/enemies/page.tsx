import { prisma, safeDb } from '@/lib/db'
import EnemiesAdminClient from './EnemiesAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminEnemiesPage() {
  const enemies = await safeDb(
    () =>
      prisma.enemy.findMany({
        orderBy: [{ enemyClass: 'asc' }, { name: 'asc' }],
      }),
    []
  )

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">إدارة الأعداء والزعماء (Enemies & Bosses)</h1>
        <p className="text-sm text-slate-400 mt-1">
          إدارة وتعديل وحوش وزعماء Wuthering Waves وتصنيفاتهم وعناصرهم ونقاط القوة والضعف.
        </p>
      </div>

      <EnemiesAdminClient initialEnemies={enemies} />
    </div>
  )
}
