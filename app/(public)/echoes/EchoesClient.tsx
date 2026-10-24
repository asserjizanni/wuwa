'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, Sparkles, Clock, X, Layers } from 'lucide-react'

interface EchoItem {
  id: string
  slug: string
  name: string
  nameAr: string | null
  echoClass: string | null
  cost: number
  iconUrl: string | null
  cooldown: number | null
  description: string | null
  descriptionAr: string | null
  sonataSets: string[]
  buffs: any
}

interface SonataSetItem {
  id: string
  slug: string
  name: string
  nameAr: string | null
  iconUrl: string | null
  twoPieceEffect: string | null
  twoPieceEffectAr: string | null
  fivePieceEffect: string | null
  fivePieceEffectAr: string | null
}

const COSTS = [
  { key: 'ALL', label: 'جميع الكوستات' },
  { key: '4',   label: 'كوست 4 (زعماء Calamity/Overlord)' },
  { key: '3',   label: 'كوست 3 (نخبة Elite)' },
  { key: '1',   label: 'كوست 1 (عادي Common)' },
]

export default function EchoesClient({
  initialEchoes,
  initialSets,
}: {
  initialEchoes: EchoItem[]
  initialSets: SonataSetItem[]
}) {
  const [tab, setTab] = useState<'echoes' | 'sets'>('echoes')
  const [search, setSearch] = useState('')
  const [selectedCost, setSelectedCost] = useState('ALL')
  const [selectedSet, setSelectedSet] = useState('ALL')
  const [activeEcho, setActiveEcho] = useState<EchoItem | null>(null)
  const [activeSet, setActiveSet] = useState<SonataSetItem | null>(null)

  // Map sets for quick lookup
  const setsMap = useMemo(() => {
    const map = new Map<string, SonataSetItem>()
    for (const s of initialSets) {
      map.set(s.slug, s)
    }
    return map
  }, [initialSets])

  const filteredEchoes = useMemo(() => {
    return initialEchoes.filter((e) => {
      const matchSearch =
        !search.trim() ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.nameAr && e.nameAr.includes(search)) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
        (e.descriptionAr && e.descriptionAr.includes(search))

      const matchCost = selectedCost === 'ALL' || String(e.cost) === selectedCost
      const matchSet  = selectedSet  === 'ALL' || e.sonataSets.includes(selectedSet)

      return matchSearch && matchCost && matchSet
    })
  }, [initialEchoes, search, selectedCost, selectedSet])

  const filteredSets = useMemo(() => {
    return initialSets.filter((s) => {
      return (
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.nameAr && s.nameAr.includes(search)) ||
        (s.twoPieceEffect && s.twoPieceEffect.toLowerCase().includes(search.toLowerCase())) ||
        (s.twoPieceEffectAr && s.twoPieceEffectAr.includes(search)) ||
        (s.fivePieceEffect && s.fivePieceEffect.toLowerCase().includes(search.toLowerCase())) ||
        (s.fivePieceEffectAr && s.fivePieceEffectAr.includes(search))
      )
    })
  }, [initialSets, search])

  return (
    <div>
      {/* Top Navigation Tabs: Echoes vs Sonata Sets */}
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
        <button
          onClick={() => setTab('echoes')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            tab === 'echoes'
              ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          قائمة الإيكو ({initialEchoes.length})
        </button>

        <button
          onClick={() => setTab('sets')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            tab === 'sets'
              ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Layers className="w-4 h-4" />
          مجموعات السوناتا ({initialSets.length})
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[#070c18]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'echoes' ? 'ابحث عن إيكو بالاسم أو المهارة...' : 'ابحث عن مجموعة سوناتا...'}
            className="w-full bg-[#040812] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {tab === 'echoes' && (
          <>
            {/* Cost Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {COSTS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCost(c.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCost === c.key
                      ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Sonata Set Selector */}
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500/50 max-w-[220px]"
            >
              <option value="ALL">جميع مجموعات السوناتا</option>
              {initialSets.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.nameAr || s.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Tab 1: Echoes View */}
      {tab === 'echoes' && (
        <div>
          <div className="flex items-center justify-between mb-6 text-sm text-slate-400">
            <span>
              عرض <strong className="text-white font-bold">{filteredEchoes.length}</strong> إيكو
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredEchoes.map((echo) => {
              const isCost4 = echo.cost === 4
              const isCost3 = echo.cost === 3

              return (
                <div
                  key={echo.id}
                  onClick={() => setActiveEcho(echo)}
                  className={`group relative rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer border transition-all duration-300 hover:-translate-y-1 ${
                    isCost4
                      ? 'bg-gradient-to-b from-amber-500/10 via-[#0a0f1d] to-[#040812] border-amber-500/30 hover:border-amber-400/70 shadow-[0_4px_20px_rgba(245,158,11,0.1)]'
                      : isCost3
                      ? 'bg-gradient-to-b from-purple-500/10 via-[#0a0f1d] to-[#040812] border-purple-500/30 hover:border-purple-400/70'
                      : 'bg-[#0a0f1d] border-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Cost & Class Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        isCost4
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isCost3
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      كوست {echo.cost}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{(echo as any).echoClass || 'Common'}</span>
                  </div>

                  {/* Icon */}
                  <div className="relative w-full aspect-square my-2 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
                    {echo.iconUrl ? (
                      <Image
                        src={echo.iconUrl}
                        alt={echo.name}
                        fill
                        className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <Sparkles className="w-10 h-10 text-slate-600" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-center mt-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {echo.nameAr || echo.name}
                    </h3>
                    {echo.nameAr && echo.nameAr !== echo.name && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{echo.name}</p>
                    )}

                    {/* Sonata icons preview */}
                    <div className="flex items-center justify-center gap-1 mt-2.5">
                      {echo.sonataSets.slice(0, 3).map((setName) => {
                        const sItem = setsMap.get(setName)
                        return (
                          <div
                            key={setName}
                            title={sItem?.nameAr || sItem?.name || setName}
                            className="w-5 h-5 rounded-full bg-white/10 p-0.5 relative overflow-hidden"
                          >
                            {sItem?.iconUrl && (
                              <Image
                                src={sItem.iconUrl}
                                alt={setName}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Sonata Sets View */}
      {tab === 'sets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSets.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSet(s)}
              className="bg-[#080d1c] border border-white/10 hover:border-cyan-500/40 rounded-3xl p-6 transition-all cursor-pointer shadow-xl group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-2xl bg-black/40 border border-white/10 p-2 shrink-0">
                  {s.iconUrl && (
                    <Image
                      src={s.iconUrl}
                      alt={s.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    {s.nameAr || s.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{s.name}</p>
                </div>
              </div>

              {/* Set Effects */}
              <div className="space-y-3 mt-4 text-xs leading-relaxed">
                <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-xl p-3">
                  <span className="font-bold text-cyan-400 block mb-1">✨ تأثير قطعتين (2-Piece):</span>
                  <p className="text-slate-300">{s.twoPieceEffectAr || s.twoPieceEffect || '—'}</p>
                </div>

                <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3">
                  <span className="font-bold text-purple-400 block mb-1">🌟 تأثير خمس قطع (5-Piece):</span>
                  <p className="text-slate-300">{s.fivePieceEffectAr || s.fivePieceEffect || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Echo Detail Modal */}
      {activeEcho && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl bg-[#090e1c] border border-cyan-500/20 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-right"
            dir="rtl"
          >
            <button
              onClick={() => setActiveEcho(null)}
              className="absolute left-6 top-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-5 pb-5 border-b border-white/10">
              <div className="relative w-20 h-20 rounded-2xl bg-black/40 border border-white/10 shrink-0 overflow-hidden">
                {activeEcho.iconUrl && (
                  <Image
                    src={activeEcho.iconUrl}
                    alt={activeEcho.name}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                    كوست {activeEcho.cost}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{(activeEcho as any).echoClass}</span>
                </div>
                <h3 className="text-xl font-black text-white">{activeEcho.nameAr || activeEcho.name}</h3>
                <p className="text-xs text-slate-400 font-medium">{activeEcho.name}</p>
              </div>
            </div>

            {/* Cooldown */}
            {activeEcho.cooldown && (
              <div className="my-4 flex items-center gap-2 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>فترة التهدئة (Cooldown): </span>
                <strong className="text-white font-black">{activeEcho.cooldown} ثانية</strong>
              </div>
            )}

            {/* Active Skill */}
            <div className="my-4">
              <h4 className="text-xs font-bold text-slate-400 mb-2">قدرة الإيكو النشطة (Echo Skill):</h4>
              <div className="bg-[#040812] border border-white/5 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed">
                {activeEcho.descriptionAr || activeEcho.description || 'لا يوجد وصف متاح للقدرة.'}
              </div>
            </div>

            {/* Compatible Sonata Sets */}
            {activeEcho.sonataSets.length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-bold text-slate-400 mb-2.5">مجموعات السوناتا المتوافقة:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {activeEcho.sonataSets.map((setName) => {
                    const sItem = setsMap.get(setName)
                    return (
                      <div
                        key={setName}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="relative w-8 h-8 rounded-lg bg-black/40 shrink-0">
                          {sItem?.iconUrl && (
                            <Image
                              src={sItem.iconUrl}
                              alt={setName}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{sItem?.nameAr || sItem?.name || setName}</p>
                          <p className="text-[10px] text-slate-400">{sItem?.name || setName}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
