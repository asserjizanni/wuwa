import type { Metadata } from 'next'
import { Suspense } from 'react'
import CharactersClient from './CharactersClient'
import { prisma, safeDb } from '@/lib/db'
import { getStoredCharacters } from '@/lib/data/characterStore'

export const metadata: Metadata = {
  title: 'الشخصيات — Wuthering Waves Builds',
  description: 'تصفح جميع شخصيات Wuthering Waves. صفّح حسب Elements والسلاح والندرة وابحث عن دليل وبناء لكل Resonator.',
}

export const revalidate = 30

async function getCharacters() {
  const list = await safeDb(
    () =>
      prisma.character.findMany({
        where: { isPublished: true },
        include: {
          guides: {
            where: { status: 'PUBLISHED', isActive: true },
            select: { id: true, title: true, pageCount: true, publishedAt: true },
            take: 1,
            orderBy: { publishedAt: 'desc' },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    []
  )

  if (list && list.length > 0) return list
  return getStoredCharacters().filter(c => c.isPublished)
}

export default async function CharactersPage() {
  const characters = await getCharacters()

  return (
    <div className="pt-[68px] min-h-screen" dir="rtl">
      {/* ── Page header ── */}
      <div className="border-b border-white/[0.05] relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,200,255,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="container-main py-14 relative z-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#00c8ff]" />
            <span className="text-[#00c8ff] text-xs font-bold tracking-[0.2em] uppercase">Resonators Guide</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
            جميع الشخصيات
          </h1>
          <p className="text-[#8fa8c4] text-base">
            <span className="text-white font-bold">{characters.length}</span> شخصية متاحة
          </p>
        </div>
      </div>

      <Suspense fallback={<CharactersLoadingSkeleton />}>
        <CharactersClient initialCharacters={characters as any[]} />
      </Suspense>
    </div>
  )
}

function CharactersLoadingSkeleton() {
  return (
    <div className="container-main py-10" dir="rtl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="skeleton aspect-[3/4]" />
            <div className="p-3 space-y-2">
              <div className="skeleton h-3.5 w-3/4" />
              <div className="skeleton h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
