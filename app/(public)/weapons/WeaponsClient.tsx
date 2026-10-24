'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Zap, Star, X } from 'lucide-react'

interface Weapon {
  id: string
  slug: string
  name: string
  nameAr: string | null
  weaponType: string
  rarity: string
  stars: number
  iconUrl: string | null
  imageBig: string | null
  baseAtk: number | null
  secondaryStat: string | null
  secondaryStatValue: string | null
  desc: string | null
  descAr: string | null
  buffs: any
  passiveBuffs: any
  stats: any
  signatureCharacter: string | null
  compatibleCharacters: string[]
}

const WEAPON_TYPES = [
  { key: 'ALL',        label: 'الكل' },
  { key: 'SWORD',      label: 'سيف (Sword)' },
  { key: 'BROADBLADE', label: 'سيف عريض (Broadblade)' },
  { key: 'PISTOLS',    label: 'مسدسات (Pistols)' },
  { key: 'GAUNTLETS',  label: 'قفازات (Gauntlets)' },
  { key: 'RECTIFIER',  label: 'محول (Rectifier)' },
]

const RARITIES = [
  { key: 'ALL', label: 'جميع النجوم' },
  { key: '5',   label: '⭐⭐⭐⭐⭐ 5 نجوم' },
  { key: '4',   label: '⭐⭐⭐⭐ 4 نجوم' },
  { key: '3',   label: '⭐⭐⭐ 3 نجوم' },
]

export default function WeaponsClient({ initialWeapons }: { initialWeapons: Weapon[] }) {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedRarity, setSelectedRarity] = useState('ALL')
  const [activeWeapon, setActiveWeapon] = useState<Weapon | null>(null)
  const [refinementRank, setRefinementRank] = useState(5)

  const filteredWeapons = useMemo(() => {
    return initialWeapons.filter((w) => {
      const matchSearch =
        !search.trim() ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.nameAr && w.nameAr.includes(search)) ||
        (w.desc && w.desc.toLowerCase().includes(search.toLowerCase())) ||
        (w.descAr && w.descAr.includes(search))

      const matchType   = selectedType   === 'ALL' || w.weaponType === selectedType
      const matchRarity = selectedRarity === 'ALL' || String(w.stars) === selectedRarity

      return matchSearch && matchType && matchRarity
    })
  }, [initialWeapons, search, selectedType, selectedRarity])

  // Get active weapon's description for selected rank
  const getWeaponDesc = (w: Weapon, rank: number) => {
    if (w.descAr) {
      try {
        const parsed = JSON.parse(w.descAr)
        if (typeof parsed === 'object' && parsed[rank]) return parsed[rank]
      } catch {
        // raw string
      }
      return w.descAr
    }
    if (w.desc) {
      try {
        const parsed = JSON.parse(w.desc)
        if (typeof parsed === 'object' && parsed[rank]) return parsed[rank]
      } catch {
        // raw string
      }
      return w.desc
    }
    return 'لا يوجد وصف متاح.'
  }

  return (
    <div>
      {/* Controls: Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[#070c18]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن سلاح بالاسم العربي أو الإنجليزي..."
            className="w-full bg-[#040812] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {/* Weapon Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {WEAPON_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedType === t.key
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Rarity Select */}
        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          {RARITIES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6 text-sm text-slate-400">
        <span>
          عرض <strong className="text-white font-bold">{filteredWeapons.length}</strong> سلاح
        </span>
      </div>

      {/* Weapons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredWeapons.map((weapon) => {
          const is5Star = weapon.stars === 5
          const is4Star = weapon.stars === 4

          return (
            <div
              key={weapon.id}
              onClick={() => {
                setActiveWeapon(weapon)
                setRefinementRank(5)
              }}
              className={`group relative rounded-2xl p-3 flex flex-col justify-between cursor-pointer border transition-all duration-300 hover:-translate-y-1 ${
                is5Star
                  ? 'bg-gradient-to-b from-amber-500/10 via-[#0a0f1d] to-[#040812] border-amber-500/20 hover:border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.25)]'
                  : is4Star
                  ? 'bg-gradient-to-b from-purple-500/10 via-[#0a0f1d] to-[#040812] border-purple-500/20 hover:border-purple-400/60 shadow-[0_4px_20px_rgba(168,85,247,0.08)]'
                  : 'bg-[#0a0f1d] border-white/5 hover:border-white/20'
              }`}
            >
              {/* Star Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center text-[10px] text-amber-400 font-black">
                  {'★'.repeat(weapon.stars)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                  {weapon.weaponType}
                </span>
              </div>

              {/* Weapon Icon */}
              <div className="relative w-full aspect-square my-2 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center">
                {weapon.iconUrl ? (
                  <Image
                    src={weapon.iconUrl}
                    alt={weapon.name}
                    fill
                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <Zap className="w-10 h-10 text-slate-600" />
                )}
              </div>

              {/* Name & Quick Details */}
              <div className="text-center mt-2">
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {weapon.nameAr || weapon.name}
                </h3>
                {weapon.nameAr && weapon.nameAr !== weapon.name && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{weapon.name}</p>
                )}

                {/* Signature Indicator */}
                {weapon.signatureCharacter && (
                  <div className="mt-2 text-[10px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 rounded-md py-0.5 px-1 truncate">
                    سلاح {weapon.signatureCharacter}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal / Quick View Drawer */}
      {activeWeapon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-[#090e1c] border border-cyan-500/20 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-right"
            dir="rtl"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveWeapon(null)}
              className="absolute left-6 top-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-white/10">
              <div className="relative w-28 h-28 rounded-2xl bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                {activeWeapon.iconUrl && (
                  <Image
                    src={activeWeapon.iconUrl}
                    alt={activeWeapon.name}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                )}
              </div>

              <div className="flex-1 text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-amber-400 font-bold text-sm">{'★'.repeat(activeWeapon.stars)}</span>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {activeWeapon.weaponType}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{activeWeapon.nameAr || activeWeapon.name}</h2>
                <p className="text-sm text-slate-400 font-medium">{activeWeapon.name}</p>

                {activeWeapon.signatureCharacter && (
                  <p className="mt-2 text-xs font-bold text-amber-300">
                    ✨ السلاح المخصص لـ: <span className="underline">{activeWeapon.signatureCharacter}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Refinement Selector (R1 - R5) */}
            <div className="my-6 bg-[#040812] p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300">مستوى الترقية (Rank Refinement):</span>
                <span className="text-xs font-black text-cyan-400">مستوى R{refinementRank}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRefinementRank(r)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      refinementRank === r
                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    R{r}
                  </button>
                ))}
              </div>
            </div>

            {/* Passive Effect */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                تأثير المهارة السلبية (R{refinementRank}):
              </h4>
              <div
                className="bg-cyan-950/20 border border-cyan-800/30 rounded-2xl p-4 text-sm text-slate-200 leading-relaxed [&_.highlight-1]:text-amber-300 [&_.highlight-2]:text-cyan-300 [&_.highlight-1]:font-bold [&_.highlight-2]:font-bold"
                dangerouslySetInnerHTML={{ __html: getWeaponDesc(activeWeapon, refinementRank) }}
              />
            </div>

            {/* Compatible Characters */}
            {activeWeapon.compatibleCharacters && activeWeapon.compatibleCharacters.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  شخصيات ينصح بها لهذا السلاح:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeWeapon.compatibleCharacters.map((charSlug) => (
                    <Link
                      key={charSlug}
                      href={`/characters/${charSlug}`}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-xs font-bold text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
                    >
                      <span>{charSlug.replace(/-/g, ' ')}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
