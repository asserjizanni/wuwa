import { prisma, safeDb } from '@/lib/db'
import WeaponsAdminClient from './WeaponsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminWeaponsPage() {
  const weapons = await safeDb(
    () =>
      prisma.weapon.findMany({
        orderBy: [{ stars: 'desc' }, { name: 'asc' }],
      }),
    []
  )

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">إدارة الأسلحة (Weapons Management)</h1>
        <p className="text-sm text-slate-400 mt-1">
          إضافة وتعديل وحذف أسلحة اللعبة، وتحديث خصائص الترقية R1–R5 والتوافق مع الشخصيات.
        </p>
      </div>

      <WeaponsAdminClient initialWeapons={weapons} />
    </div>
  )
}
