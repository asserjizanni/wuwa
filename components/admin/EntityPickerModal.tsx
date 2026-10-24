'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Search, X, Check, Shield } from 'lucide-react'

export interface DbWeapon {
  id: string
  slug: string
  name: string
  nameAr: string | null
  weaponType: string
  stars: number
  iconUrl: string | null
}

export interface DbCharacter {
  id: string
  slug: string
  name: string
  nameAr: string | null
  element: string
  weaponType: string
  rarity: string
  iconUrl: string | null
  portraitPath: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (item: DbWeapon | DbCharacter) => void
  mode: 'weapon' | 'character'
  weaponType?: string
  title?: string
}

const STAR_COLORS: Record<number, string> = {
  1: 'border-slate-500',
  2: 'border-green-600',
  3: 'border-blue-500',
  4: 'border-purple-500',
  5: 'border-amber-400',
}

const RARITY_COLORS: Record<string, string> = {
  FIVE_STAR: 'border-amber-400',
  FOUR_STAR: 'border-purple-500',
}

export default function EntityPickerModal({ open, onClose, onSelect, mode, weaponType, title }: Props) {
  const [items, setItems] = useState<(DbWeapon | DbCharacter)[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const fetchTimeout = useRef<NodeJS.Timeout>()

  const fetchItems = useCallback(
    async (q: string) => {
      setLoading(true)
      try {
        let url = ''
        if (mode === 'weapon') {
          const params = new URLSearchParams({ limit: '200' })
          if (q) params.set('q', q)
          if (weaponType) params.set('weaponType', weaponType)
          url = `/api/admin/weapons?${params}`
        } else {
          const params = new URLSearchParams({ limit: '200' })
          if (q) params.set('search', q)
          url = `/api/admin/characters?${params}`
        }
        const res = await fetch(url)
        const data = await res.json()
        setItems(mode === 'weapon' ? data.weapons || data || [] : data.characters || data || [])
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [mode, weaponType]
  )

  useEffect(() => {
    if (!open) return
    clearTimeout(fetchTimeout.current)
    fetchTimeout.current = setTimeout(() => fetchItems(search), 300)
    return () => clearTimeout(fetchTimeout.current)
  }, [open, search, fetchItems])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 100)
      setSearch('')
    }
  }, [open])

  if (!open) return null

  const defaultTitle = mode === 'weapon' ? 'اختر سلاحاً' : 'اختر شخصية'

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 font-tajawal text-base">
            <Shield className="w-4 h-4 text-purple-400" />
            {title || defaultTitle}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
              dir="auto"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3" />
              جارٍ التحميل...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm gap-3">
              <Shield className="w-10 h-10 opacity-30" />
              <span>لا توجد نتائج</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {items.map((item) => {
                const isWeapon = mode === 'weapon'
                const w = item as DbWeapon
                const c = item as DbCharacter
                const imgUrl = isWeapon ? w.iconUrl : (c.iconUrl || c.portraitPath)
                const stars = isWeapon ? w.stars : undefined
                const rarity = !isWeapon ? c.rarity : undefined
                const borderClass = isWeapon
                  ? STAR_COLORS[stars || 5] || 'border-slate-500'
                  : RARITY_COLORS[rarity || 'FIVE_STAR'] || 'border-amber-400'

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item)
                      onClose()
                    }}
                    className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/[0.08] bg-black/30 hover:bg-white/5 hover:border-white/20 transition cursor-pointer text-center"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg border-2 overflow-hidden bg-black/40 flex items-center justify-center shrink-0 ${borderClass}`}
                    >
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
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
                        <Shield className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <span className="text-[10px] leading-tight text-slate-300 group-hover:text-white transition line-clamp-2 font-tajawal w-full">
                      {item.nameAr || item.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10 text-center text-xs text-slate-500 shrink-0">
          {items.length} عنصر متاح — انقر للاختيار
        </div>
      </div>
    </div>
  )
}
