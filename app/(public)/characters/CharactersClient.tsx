'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, BookOpen, SortAsc, ChevronDown } from 'lucide-react'
import CharacterCard from '@/components/characters/CharacterCard'

const ELEMENTS = ['AERO', 'SPECTRO', 'FUSION', 'ELECTRO', 'GLACIO', 'HAVOC']
const WEAPONS  = ['BROADBLADE', 'SWORD', 'PISTOLS', 'GAUNTLETS', 'RECTIFIER']

const ELEMENT_AR: Record<string, string> = {
  AERO:    'Aero',
  SPECTRO: 'Spectro',
  FUSION:  'Fusion',
  ELECTRO: 'Electro',
  GLACIO:  'Glacio',
  HAVOC:   'Havoc',
}
const WEAPON_AR: Record<string, string> = {
  BROADBLADE:  'سيف عريض',
  SWORD:       'سيف',
  PISTOLS:     'مسدسان',
  GAUNTLETS:   'قفازات',
  RECTIFIER:   'مُصحِّح',
}

const ELEMENT_COLORS: Record<string, string> = {
  AERO:    'rgba(56,189,248,0.15)',
  SPECTRO: 'rgba(251,191,36,0.15)',
  FUSION:  'rgba(239,68,68,0.15)',
  ELECTRO: 'rgba(168,85,247,0.15)',
  GLACIO:  'rgba(147,197,253,0.15)',
  HAVOC:   'rgba(107,33,168,0.15)',
}
const ELEMENT_TEXT: Record<string, string> = {
  AERO:    '#38bdf8',
  SPECTRO: '#fbbf24',
  FUSION:  '#f87171',
  ELECTRO: '#c084fc',
  GLACIO:  '#bfdbfe',
  HAVOC:   '#a78bfa',
}

interface CharactersClientProps {
  initialCharacters: any[]
}

export default function CharactersClient({ initialCharacters }: CharactersClientProps) {
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<'ALL' | 'AVAILABLE' | 'COMING_SOON'>('ALL')
  const [element, setElement]             = useState<string | null>(null)
  const [weapon, setWeapon]               = useState<string | null>(null)
  const [rarity, setRarity]               = useState<string | null>(null)
  const [guideOnly, setGuideOnly]         = useState(false)
  const [sortBy, setSortBy]               = useState<'name' | 'guide'>('name')

  const filtered = useMemo(() => {
    let list = [...initialCharacters]

    // Status filter
    if (statusFilter === 'AVAILABLE') {
      list = list.filter(c => !c.isComingSoon && c.isPublished !== false)
    } else if (statusFilter === 'COMING_SOON') {
      list = list.filter(c => c.isComingSoon || c.isPublished === false)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.nameAr && c.nameAr.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q))
      )
    }
    if (element)    list = list.filter(c => c.element    === element)
    if (weapon)     list = list.filter(c => c.weaponType === weapon)
    if (rarity)     list = list.filter(c => c.rarity     === rarity)
    if (guideOnly)  list = list.filter(c => c.guides?.length > 0)

    list.sort((a, b) => {
      // 1. Coming soon characters ALWAYS appear first
      if (a.isComingSoon && !b.isComingSoon) return -1
      if (!a.isComingSoon && b.isComingSoon) return 1

      // 2. If both are coming soon, newer release version or sortOrder first
      if (a.isComingSoon && b.isComingSoon) {
        if (a.releaseVersion && b.releaseVersion) {
          const vComp = b.releaseVersion.localeCompare(a.releaseVersion, undefined, { numeric: true })
          if (vComp !== 0) return vComp
        }
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      }

      // 3. For regular characters, apply chosen sort (name or guide date)
      if (sortBy === 'name') {
        return (a.nameAr || a.name).localeCompare(b.nameAr || b.name)
      } else {
        const aT = a.guides?.[0]?.publishedAt ? new Date(a.guides[0].publishedAt).getTime() : 0
        const bT = b.guides?.[0]?.publishedAt ? new Date(b.guides[0].publishedAt).getTime() : 0
        return bT - aT
      }
    })
    return list
  }, [initialCharacters, statusFilter, search, element, weapon, rarity, guideOnly, sortBy])

  const hasFilters = !!(search || statusFilter !== 'ALL' || element || weapon || rarity || guideOnly)
  const clearAll   = () => {
    setSearch('')
    setStatusFilter('ALL')
    setElement(null)
    setWeapon(null)
    setRarity(null)
    setGuideOnly(false)
  }

  return (
    <div dir="rtl" className="container-main py-10">

      {/* ── Filter bar ── */}
      <div
        className="relative md:sticky md:top-[68px] z-30 mb-8 rounded-2xl border border-white/[0.07] overflow-hidden"
        style={{ background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(20px)' }}
      >
        <div className="px-5 py-4 space-y-4">

          {/* Search input */}
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4d6580] pointer-events-none"
            />
            <input
              id="character-search"
              type="text"
              placeholder="ابحث باسم الشخصية العربية أو الإنجليزية..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pr-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4d6580] hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter chips row */}
          <div className="flex flex-wrap gap-2.5 items-center">

            {/* حالة الصفحة (Page Status) */}
            <div className="flex items-center gap-1 bg-[#040812] px-2 py-1 rounded-xl border border-white/10">
              <span className="text-[11px] font-bold text-slate-400 pl-1.5 border-l border-white/10">
                حالة الصفحة:
              </span>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'AVAILABLE', label: 'متاح' },
                { id: 'COMING_SOON', label: 'قريباً' },
              ].map(st => {
                const active = statusFilter === st.id
                return (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? st.id === 'COMING_SOON'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                          : 'bg-cyan-500 text-black shadow-sm font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {st.label}
                  </button>
                )
              })}
            </div>

            <div className="w-px h-5 bg-white/[0.07] hidden sm:block" />

            {/* Elements */}
            {ELEMENTS.map(el => {
              const active = element === el
              return (
                <button
                  key={el}
                  onClick={() => setElement(active ? null : el)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200"
                  style={{
                    background:   active ? ELEMENT_COLORS[el]         : 'transparent',
                    color:        active ? ELEMENT_TEXT[el]            : '#4d6580',
                    borderColor:  active ? ELEMENT_TEXT[el] + '55'     : 'rgba(255,255,255,0.08)',
                    opacity:      element && !active ? 0.45 : 1,
                  }}
                >
                  {ELEMENT_AR[el]}
                </button>
              )
            })}

            <div className="w-px h-5 bg-white/[0.07] hidden sm:block" />

            {/* Weapons */}
            {WEAPONS.map(wep => {
              const active = weapon === wep
              return (
                <button
                  key={wep}
                  onClick={() => setWeapon(active ? null : wep)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200"
                  style={{
                    background:  active ? 'rgba(0,200,255,0.12)' : 'transparent',
                    color:       active ? '#00c8ff'               : '#4d6580',
                    borderColor: active ? 'rgba(0,200,255,0.35)'  : 'rgba(255,255,255,0.08)',
                    opacity:     weapon && !active ? 0.45 : 1,
                  }}
                >
                  {WEAPON_AR[wep]}
                </button>
              )
            })}

            <div className="w-px h-5 bg-white/[0.07] hidden sm:block" />

            {/* Rarity */}
            {[
              { v: 'FIVE_STAR', label: '5 ★' },
              { v: 'FOUR_STAR', label: '4 ★' },
            ].map(({ v, label }) => {
              const active = rarity === v
              const color  = v === 'FIVE_STAR' ? '#e8a32e' : '#a78bfa'
              return (
                <button
                  key={v}
                  onClick={() => setRarity(active ? null : v)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 latin"
                  style={{
                    background:  active ? `${color}22` : 'transparent',
                    color:       active ? color        : '#4d6580',
                    borderColor: active ? `${color}55` : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {label}
                </button>
              )
            })}

            <div className="w-px h-5 bg-white/[0.07] hidden sm:block" />

            {/* Has guide */}
            <button
              onClick={() => setGuideOnly(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200"
              style={{
                background:  guideOnly ? 'rgba(0,200,255,0.12)'   : 'transparent',
                color:       guideOnly ? '#00c8ff'                 : '#4d6580',
                borderColor: guideOnly ? 'rgba(0,200,255,0.35)'    : 'rgba(255,255,255,0.08)',
              }}
            >
              <BookOpen size={12} />
              البِلدات المتوفرة
            </button>

            {/* Sort */}
            <button
              onClick={() => setSortBy(s => s === 'name' ? 'guide' : 'name')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-white/[0.08] text-[#4d6580] hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <SortAsc size={12} />
              {sortBy === 'name' ? 'أبجدي' : 'أحدث دليل'}
            </button>

            {/* Clear */}
            <AnimatePresence>
              {hasFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/30 text-red-400/80 hover:bg-red-500/10 transition-all duration-200"
                >
                  <X size={12} />
                  مسح الفلاتر
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Result count */}
          <p className="text-[#4d6580] text-xs">
            عرض{' '}
            <span className="text-[#8fa8c4] font-semibold">{filtered.length}</span>
            {' '}من{' '}
            <span className="text-[#8fa8c4] font-semibold">{initialCharacters.length}</span>
            {' '}شخصية
          </p>
        </div>
      </div>

      {/* ── Characters grid ── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(15,24,41,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Search size={32} className="text-[#4d6580]" />
            </div>
            <h3 className="text-white font-bold text-xl mb-3">لا توجد نتائج</h3>
            <p className="text-[#4d6580] text-sm mb-8 max-w-xs">
              جرّب تعديل الفلاتر أو كلمة البحث
            </p>
            <button onClick={clearAll} className="btn btn-outline text-sm px-6 py-3">
              مسح الفلاتر
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {filtered.map((char, i) => (
              <CharacterCard key={char.id} character={char} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
