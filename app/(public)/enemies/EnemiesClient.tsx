'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, Skull, X } from 'lucide-react'

interface EnemyItem {
  id: string
  slug: string
  name: string
  nameAr: string | null
  enemyClass: string | null
  elements: string[]
  hp: number | null
  atk: number | null
  def: number | null
  description: string | null
  descriptionAr: string | null
  iconUrl: string | null
  artworkUrl: string | null
}

const CLASSES = [
  { key: 'ALL',      label: 'جميع الفئات' },
  { key: 'Calamity', label: 'كوارث (Calamity)' },
  { key: 'Overlord', label: 'أسياد (Overlord)' },
  { key: 'Elite',    label: 'نخبة (Elite)' },
  { key: 'Common',   label: 'عادي (Common)' },
]

const ELEMENTS = [
  { key: 'ALL',      label: 'جميع العناصر' },
  { key: 'Fusion',   label: 'فيوجن (Fusion)' },
  { key: 'Glacio',   label: 'جلاسيو (Glacio)' },
  { key: 'Electro',  label: 'إلكترو (Electro)' },
  { key: 'Aero',     label: 'إيرو (Aero)' },
  { key: 'Spectro',  label: 'سبيكسترو (Spectro)' },
  { key: 'Havoc',    label: 'هافوك (Havoc)' },
  { key: 'Physical', label: 'جسدي (Physical)' },
]

export default function EnemiesClient({ initialEnemies }: { initialEnemies: EnemyItem[] }) {
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('ALL')
  const [selectedElement, setSelectedElement] = useState('ALL')
  const [activeEnemy, setActiveEnemy] = useState<EnemyItem | null>(null)

  const filteredEnemies = useMemo(() => {
    return initialEnemies.filter((en) => {
      const matchSearch =
        !search.trim() ||
        en.name.toLowerCase().includes(search.toLowerCase()) ||
        (en.nameAr && en.nameAr.includes(search)) ||
        (en.description && en.description.toLowerCase().includes(search.toLowerCase()))

      const matchClass   = selectedClass   === 'ALL' || en.enemyClass === selectedClass
      const matchElement = selectedElement === 'ALL' || en.elements.includes(selectedElement)

      return matchSearch && matchClass && matchElement
    })
  }, [initialEnemies, search, selectedClass, selectedElement])

  return (
    <div>
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[#070c18]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن وحش أو زعيم بالاسم..."
            className="w-full bg-[#040812] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CLASSES.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedClass(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedClass === c.key
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Element Filter */}
        <select
          value={selectedElement}
          onChange={(e) => setSelectedElement(e.target.value)}
          className="bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-red-500/50"
        >
          {ELEMENTS.map((elem) => (
            <option key={elem.key} value={elem.key}>
              {elem.label}
            </option>
          ))}
        </select>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between mb-6 text-sm text-slate-400">
        <span>
          عرض <strong className="text-white font-bold">{filteredEnemies.length}</strong> عدو وزعيم
        </span>
      </div>

      {/* Enemies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredEnemies.map((enemy) => {
          const isBoss = enemy.enemyClass === 'Calamity' || enemy.enemyClass === 'Overlord'

          return (
            <div
              key={enemy.id}
              onClick={() => setActiveEnemy(enemy)}
              className={`group relative rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer border transition-all duration-300 hover:-translate-y-1 ${
                isBoss
                  ? 'bg-gradient-to-b from-red-500/15 via-[#0c0d1e] to-[#040812] border-red-500/30 hover:border-red-400/70 shadow-[0_4px_20px_rgba(239,68,68,0.12)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.25)]'
                  : 'bg-[#0a0f1d] border-white/5 hover:border-white/20'
              }`}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    enemy.enemyClass === 'Calamity'
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : enemy.enemyClass === 'Overlord'
                      ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                      : enemy.enemyClass === 'Elite'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {enemy.enemyClass || 'Common'}
                </span>

                {/* Elements */}
                <div className="flex items-center gap-1">
                  {enemy.elements.map((el) => (
                    <span
                      key={el}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 uppercase"
                    >
                      {el}
                    </span>
                  ))}
                </div>
              </div>

              {/* Enemy Artwork */}
              <div className="relative w-full aspect-square my-2 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
                {enemy.iconUrl ? (
                  <Image
                    src={enemy.iconUrl}
                    alt={enemy.name}
                    fill
                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <Skull className="w-10 h-10 text-slate-600" />
                )}
              </div>

              {/* Names */}
              <div className="text-center mt-2">
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-300 transition-colors truncate">
                  {enemy.nameAr || enemy.name}
                </h3>
                {enemy.nameAr && enemy.nameAr !== enemy.name && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{enemy.name}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Details Modal */}
      {activeEnemy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl bg-[#090e1c] border border-red-500/20 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-right"
            dir="rtl"
          >
            <button
              onClick={() => setActiveEnemy(null)}
              className="absolute left-6 top-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-5 pb-5 border-b border-white/10">
              <div className="relative w-24 h-24 rounded-2xl bg-black/40 border border-white/10 shrink-0 overflow-hidden">
                {activeEnemy.iconUrl && (
                  <Image
                    src={activeEnemy.iconUrl}
                    alt={activeEnemy.name}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                )}
              </div>
              <div>
                <span className="text-xs font-black text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-500/20">
                  {activeEnemy.enemyClass}
                </span>
                <h3 className="text-xl font-black text-white mt-1">{activeEnemy.nameAr || activeEnemy.name}</h3>
                <p className="text-xs text-slate-400 font-medium">{activeEnemy.name}</p>

                <div className="flex items-center gap-1.5 mt-2">
                  {activeEnemy.elements.map((el) => (
                    <span
                      key={el}
                      className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-cyan-300 border border-white/10"
                    >
                      عنصر {el}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Lore Description */}
            <div className="my-5">
              <h4 className="text-xs font-bold text-slate-400 mb-2">الوصف السردي:</h4>
              <p className="bg-[#040812] border border-white/5 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
                {activeEnemy.descriptionAr || activeEnemy.description || 'لا يوجد وصف متاح لهذا الكائن.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
