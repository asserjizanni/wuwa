import { prisma, safeDb } from '@/lib/db'
import EchoesAdminClient from './EchoesAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminEchoesPage() {
  const [echoes, sonataSets] = await Promise.all([
    safeDb(
      () =>
        prisma.echo.findMany({
          orderBy: [{ cost: 'desc' }, { name: 'asc' }],
        }),
      []
    ),
    safeDb(
      () =>
        prisma.sonataSet.findMany({
          orderBy: { name: 'asc' },
        }),
      []
    ),
  ])

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">إدارة الإيكو والسوناتا (Echoes & Sonata Sets)</h1>
        <p className="text-sm text-slate-400 mt-1">
          إدارة وتعديل كائنات الإيكو (Cost 1, 3, 4)، وتأثيرات أطقم السوناتا (2-Piece & 5-Piece) وربطها بالشخصيات.
        </p>
      </div>

      <EchoesAdminClient initialEchoes={echoes} initialSonataSets={sonataSets} />
    </div>
  )
}
