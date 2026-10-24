'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Search, X, Check, Package } from 'lucide-react'

export interface DbItem {
  id: string
  slug: string
  name: string
  nameAr: string | null
  category: string
  rarity: number
  iconUrl: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  ASCENSION: 'صعود الشخصية',
  FORGERY: 'مواد الصياغة',
  BOSS_MATERIAL: 'مواد البوص',
  COMMON: 'مواد شائعة',
  WEEKLY_BOSS: 'بوص أسبوعي',
  CURRENCY: 'العملة',
  SPECIAL: 'مواد خاصة',
  SKILL: 'مواد السكل',
  ECHO: 'الإيكو',
}

const RARITY_COLORS: Record<number, string> = {
  1: 'border-slate-500',
  2: 'border-green-600',
  3: 'border-blue-500',
  4: 'border-purple-500',
  5: 'border-amber-400',
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (item: DbItem) => void
  title?: string
  filterCategory?: string
}

export default function ItemPickerModal({ open, onClose, onSelect, title = 'اختر مادة', filterCategory }: Props) {
  const [items, setItems] = useState<DbItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(filterCategory || '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const fetchTimeout = useRef<NodeJS.Timeout>()

  const fetchItems = useCallback(async (q: string, cat: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ take: '200' })
      if (q) params.set('q', q)
      if (cat) params.set('category', cat)
      const res = await fetch(`/api/admin/items?${params}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    clearTimeout(fetchTimeout.current)
    fetchTimeout.current = setTimeout(() => fetchItems(search, category), 250)
    return () => clearTimeout(fetchTimeout.current)
  }, [open, search, category, fetchItems])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 100)
      setSelectedId(null)
      setSearch('')
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 font-tajawal text-base">
            <Package className="w-4 h-4 text-cyan-400" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + filter */}
        <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم (عربي أو إنجليزي)..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              dir="auto"
            />
          </div>

          {!filterCategory && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCategory('')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  !category ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                الكل
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategory(category === key ? '' : key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    category === key
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
              جارٍ التحميل...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm gap-3">
              <Package className="w-10 h-10 opacity-30" />
              <span>لا توجد نتائج</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id)
                    onSelect(item)
                    onClose()
                  }}
                  className={`group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition cursor-pointer text-center ${
                    selectedId === item.id
                      ? 'bg-cyan-500/20 border-cyan-400/60'
                      : 'bg-black/30 border-white/[0.08] hover:bg-white/5 hover:border-white/20'
                  }`}
                  title={`${item.nameAr || item.name}\n${item.name}`}
                >
                  {selectedId === item.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                  <div
                    className={`w-12 h-12 rounded-lg border-2 overflow-hidden bg-black/40 flex items-center justify-center shrink-0 ${
                      RARITY_COLORS[item.rarity] || 'border-slate-500'
                    }`}
                  >
                    {item.iconUrl ? (
                      <Image
                        src={item.iconUrl}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <Package className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <span className="text-[10px] leading-tight text-slate-300 group-hover:text-white transition line-clamp-2 font-tajawal w-full">
                    {item.nameAr || item.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 text-center text-xs text-slate-500 shrink-0">
          {items.length} مادة متاحة — انقر على مادة لاختيارها
        </div>
      </div>
    </div>
  )
}
