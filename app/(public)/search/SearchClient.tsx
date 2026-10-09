'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, X, Sparkles } from 'lucide-react'
import CharacterCard from '@/components/characters/CharacterCard'
import { useDebounce } from '@/lib/hooks'

export default function SearchClient() {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const debouncedQuery            = useDebounce(query, 300)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.characters || [])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    doSearch(debouncedQuery)
  }, [debouncedQuery, doSearch])

  return (
    <div className="pt-20 min-h-screen relative" dir="rtl">
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle 800px at 50% 20%, rgba(0,200,255,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="container-main py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#00c8ff]" />
            <span className="text-[#00c8ff] text-xs font-bold tracking-[0.2em] uppercase">
              البحث الفوري
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-8 text-center">
            البحث عن الشخصيات
          </h1>

          {/* Search bar */}
          <div className="relative mb-10">
            <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4d6580] pointer-events-none" />
            <input
              type="text"
              id="search-input"
              autoFocus
              placeholder="اكتب اسم الشخصية بالعربية أو الإنجليزية (مثال: جينهسي، Jiyan)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full input-field pr-12 pl-12 py-4 text-base rounded-2xl border-white/[0.1] bg-[#0c1322]/80 focus:border-[#00c8ff]/50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            />
            {loading && (
              <Loader2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00c8ff] animate-spin" />
            )}
            {!loading && query && (
              <button
                onClick={() => setQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4d6580] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Results section */}
          <AnimatePresence mode="wait">
            {searched && results.length === 0 && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 rounded-3xl border border-white/[0.05] bg-[#080d1a]/50"
              >
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-white font-bold text-lg mb-2">لا توجد نتائج لـ &ldquo;{query}&rdquo;</h3>
                <p className="text-[#4d6580] text-sm">جرّب البحث باسم شخصية أخرى أو بالإنجليزية</p>
              </motion.div>
            )}

            {results.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[#8fa8c4] text-sm font-semibold">
                    تم العثور على <span className="text-[#00c8ff] font-bold">{results.length}</span> شخصية
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.map((char, i) => (
                    <CharacterCard key={char.id} character={char} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {!query && !loading && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 text-[#4d6580] rounded-3xl border border-white/[0.04] bg-[#080d1a]/30"
              >
                <Search size={42} className="mx-auto mb-4 opacity-30 text-[#00c8ff]" />
                <p className="text-sm">ابدأ بكتابة اسم الشخصية للبحث المباشر عن الدليل</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
