'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ShieldAlert, Sparkles, Layers } from 'lucide-react'

interface TierItem {
  tier: string
  titleAr?: string
  description?: string
  characters: string[]
}

interface TierListRecord {
  id: string
  slug: string
  title: string
  titleAr?: string | null
  gameVersion: string
  category: string
  description?: string | null
  tiers: any
  isPublished: boolean
}

interface CharacterInfo {
  slug: string
  name: string
  nameAr?: string | null
  element?: string | null
  weaponType?: string | null
  rarity?: string | null
}

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  T0: {
    bg: 'from-amber-500/15 via-[#0b0f1c] to-[#040812]',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    badge: 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]',
  },
  'T0.5': {
    bg: 'from-cyan-500/15 via-[#0b0f1c] to-[#040812]',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]',
  },
  T1: {
    bg: 'from-purple-500/15 via-[#0b0f1c] to-[#040812]',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    badge: 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]',
  },
  T2: {
    bg: 'from-blue-500/10 via-[#0b0f1c] to-[#040812]',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-600 text-white',
  },
  T3: {
    bg: 'from-slate-500/10 via-[#0b0f1c] to-[#040812]',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    badge: 'bg-slate-600 text-white',
  },
}

export default function TierListClient({
  tierLists,
  characters,
}: {
  tierLists: TierListRecord[]
  characters: CharacterInfo[]
}) {
  // Sort so overall tier list comes first by default
  const sortedLists = [...tierLists].sort((a, b) => {
    if (a.category === 'overall' || a.slug.includes('overall')) return -1
    if (b.category === 'overall' || b.slug.includes('overall')) return 1
    return 0
  })

  const [activeSlug, setActiveSlug] = useState<string>(
    sortedLists[0]?.slug || ''
  )

  const activeTierList =
    sortedLists.find(t => t.slug === activeSlug) || sortedLists[0]

  const charMap = new Map<string, CharacterInfo>()
  for (const c of characters) {
    charMap.set(c.slug.toLowerCase(), c)
  }

  const tiers: TierItem[] = Array.isArray(activeTierList?.tiers)
    ? (activeTierList.tiers as TierItem[])
    : []

  return (
    <div className="space-y-8">
      {/* Tier Lists Switcher Tabs */}
      {sortedLists.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 p-1.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
          {sortedLists.map((list) => {
            const isActive = list.slug === activeTierList?.slug
            const isAdversity = list.slug.includes('tower') || list.category.includes('tower')
            return (
              <button
                key={list.slug}
                onClick={() => setActiveSlug(list.slug)}
                className={`relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tierlist-tab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-purple-500/20 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isAdversity ? (
                    <ShieldAlert size={16} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  ) : (
                    <Trophy size={16} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                  )}
                  <span>{list.titleAr || list.title}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-slate-500'
                  }`}>
                    v{list.gameVersion || '1.4'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-transparent p-8 border border-white/5 shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🏆 {activeTierList?.titleAr || activeTierList?.title || 'تقييم الأداء الميداني'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Sparkles size={12} />
              الإصدار {activeTierList?.gameVersion || '1.4'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {activeTierList?.titleAr ? (
              <>
                {activeTierList.titleAr} <span className="text-gradient-cyan">Tier List</span>
              </>
            ) : (
              <>
                تصنيف شخصيات <span className="text-gradient-cyan">Tier List</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            {activeTierList?.description ||
              'قائمة تصنيف شخصيات اللعبة حسب كفاءة إلحاق الضرر، الدعم الجماعي، وتناسق الفريق في مختلف أنماط اللعب.'}
          </p>
        </div>
      </div>

      {/* Tiers Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTierList?.slug || 'tiers'}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {tiers.map((tItem) => {
            const style = TIER_COLORS[tItem.tier] || {
              bg: 'bg-[#080d1c]',
              border: 'border-white/10',
              text: 'text-slate-300',
              badge: 'bg-slate-700 text-white',
            }

            return (
              <div
                key={tItem.tier}
                className={`rounded-3xl border ${style.border} bg-gradient-to-r ${style.bg} p-6 shadow-xl relative overflow-hidden`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${style.badge}`}
                    >
                      {tItem.tier}
                    </span>
                    <div>
                      <h3 className={`text-xl font-black ${style.text}`}>
                        {tItem.titleAr || tItem.tier}
                      </h3>
                      {tItem.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{tItem.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold px-3 py-1 rounded-lg bg-black/30 border border-white/5 w-fit">
                    {(tItem.characters || []).length} شخصيات
                  </span>
                </div>

                {/* Character Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {(tItem.characters || []).map((slug: string) => {
                    const s = slug.toLowerCase()
                    const char =
                      charMap.get(s) ||
                      charMap.get(s.replace(/^the-/, '')) ||
                      charMap.get(`the-${s}`)
                    const name = char?.nameAr || char?.name || slug.replace(/-/g, ' ')
                    const charSlug = char?.slug || slug
                    const imageSrc = `/images/characters/${charSlug}.webp`

                    return (
                      <Link
                        key={slug}
                        href={`/characters/${charSlug}`}
                        className="group bg-[#040812]/80 border border-white/10 hover:border-cyan-400/60 rounded-2xl p-2.5 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(6,182,212,0.25)]"
                      >
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/40 mb-2">
                          <Image
                            src={imageSrc}
                            alt={name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 text-center truncate w-full">
                          {name}
                        </span>
                        {char?.element && (
                          <span className="text-[10px] text-slate-400 uppercase mt-0.5 font-semibold">
                            {char.element}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
