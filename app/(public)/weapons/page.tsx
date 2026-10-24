import { Metadata } from 'next'
import { prisma, safeDb } from '@/lib/db'
import WeaponsClient from './WeaponsClient'

export const metadata: Metadata = {
  title: 'قاعدة بيانات الأسلحة | Wuthering Waves Weapons',
  description: 'دليل شامل لجميع أسلحة لعبة ووذيرينغ ويفز مع إحصائيات التطوير R1-R5 والتأثيرات وتوافق الشخصيات.',
}

export const revalidate = 60

export default async function WeaponsPage() {
  const weapons = await safeDb(
    () =>
      prisma.weapon.findMany({
        where: { isPublished: true },
        orderBy: [{ stars: 'desc' }, { name: 'asc' }],
      }),
    [],
    3500,
    'weapons:list',
    300
  )

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent p-8 border border-white/5 shadow-2xl">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            ⚔️ قاعدة الأسلحة المعتمدة
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            أسلحة <span className="text-gradient-cyan">Wuthering Waves</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            استعرض جميع أسلحة اللعبة (5 نجوم، 4 نجوم، وأقل) مع مقارنة الخصائص، المهارات السلبية، وترقيات المستوى من R1 إلى R5 وقائمة الشخصيات المتوافقة.
          </p>
        </div>
      </div>

      {/* Interactive Weapons Client (Search, Filters, Grid) */}
      <WeaponsClient initialWeapons={weapons} />
    </main>
  )
}
