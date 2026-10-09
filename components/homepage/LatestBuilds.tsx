'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, ChevronLeft, FileImage } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ElementBadge from '@/components/ui/ElementBadge'

interface Guide {
  id:         string
  title:      string
  pageCount:  number
  publishedAt: string | null
  character: {
    name:         string
    slug:         string
    element:      string
    portraitPath: string | null
  }
}

export default function LatestBuilds({ guides }: { guides: Guide[] }) {
  if (guides.length === 0) return null

  return (
    <section dir="rtl" className="section-gap relative border-t border-white/[0.04]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(232,163,46,0.04) 0%, transparent 65%)' }}
      />

      <div className="container-main relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-[#e8a32e]" />
              <span className="text-[#e8a32e] text-xs font-bold tracking-[0.2em] uppercase">البِلدات</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">أحدث البِلدات</h2>
            <p className="text-[#8fa8c4] text-sm mt-2">أدلة الشخصيات المنشورة حديثاً</p>
          </div>

          <Link
            href="/characters?hasGuide=true"
            className="hidden sm:flex items-center gap-2 text-sm text-[#00c8ff] hover:text-white transition-colors font-bold group"
          >
            <span>جميع البِلدات</span>
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link
                href={`/characters/${guide.character.slug}`}
                className="group flex gap-4 p-4 rounded-2xl border border-white/[0.06] hover:border-[rgba(0,200,255,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(15,24,41,0.8) 0%, rgba(8,12,20,0.9) 100%)' }}
              >
                {/* Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

                {/* Portrait */}
                <div className="relative w-16 h-20 shrink-0 rounded-xl overflow-hidden bg-[#0f1829]">
                  {guide.character.portraitPath ? (
                    <Image
                      src={guide.character.portraitPath}
                      alt={guide.character.name}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="64px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileImage size={22} className="text-[#4d6580]" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <ElementBadge element={guide.character.element} />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-0.5 truncate group-hover:text-[#00c8ff] transition-colors">
                    {guide.character.name}
                  </h3>
                  <p className="text-[#4d6580] text-xs mb-2 truncate">{guide.title}</p>
                  <div className="flex items-center gap-3">
                    {guide.publishedAt && (
                      <span className="flex items-center gap-1 text-[#4d6580] text-xs">
                        <Calendar size={10} />
                        {formatDate(guide.publishedAt)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[#4d6580] text-xs">
                      <BookOpen size={10} />
                      {guide.pageCount} صفحة
                    </span>
                  </div>
                </div>

                <ChevronLeft
                  size={16}
                  className="text-[#4d6580] shrink-0 self-center group-hover:text-[#00c8ff] group-hover:-translate-x-1 transition-all"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
