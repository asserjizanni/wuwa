'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { Character } from '@prisma/client'
import CharacterCard from '@/components/characters/CharacterCard'

interface FeaturedCharactersProps {
  characters: (Character & {
    guides: Array<{ id: string; title: string; pageCount: number }>
  })[]
}

export default function FeaturedCharacters({ characters }: FeaturedCharactersProps) {
  if (characters.length === 0) return null

  return (
    <section dir="rtl" className="section-gap relative overflow-hidden">
      {/* Subtle background layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,200,255,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="container-main relative">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-[#00c8ff]" />
              <span className="text-[#00c8ff] text-xs font-bold tracking-[0.2em] uppercase">
                الشخصيات
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              الشخصيات
            </h2>
            <p className="text-[#8fa8c4] text-sm mt-2">دليل وبنيات رنّاني Wuthering Waves</p>
          </div>

          <Link
            href="/characters"
            className="hidden sm:flex items-center gap-2 text-sm text-[#00c8ff] hover:text-white transition-colors font-bold group"
          >
            <span>عرض الكل</span>
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4">
          {characters.map((character, i) => (
            <CharacterCard key={character.id} character={character as any} index={i} />
          ))}
        </div>

        {/* Mobile view all */}
        <div className="sm:hidden flex justify-center mt-10">
          <Link href="/characters" className="btn btn-outline px-8 py-3">
            عرض جميع الشخصيات
            <ChevronLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
