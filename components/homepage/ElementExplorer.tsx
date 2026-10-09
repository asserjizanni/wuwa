'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Wind, Sun, Flame, Zap, Snowflake, Moon } from 'lucide-react'

const ELEMENTS = [
  {
    id: 'AERO',
    name: 'هواء',
    nameEn: 'Aero',
    icon: Wind,
    color:  '#38bdf8',
    bg:     'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.25)',
    desc:   'مقاتلو الرياح المركّزون على السرعة والحركة',
  },
  {
    id: 'SPECTRO',
    name: 'طيف',
    nameEn: 'Spectro',
    icon: Sun,
    color:  '#fbbf24',
    bg:     'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
    desc:   'مقاتلو الطيف بتأثيرات الضوء والتحكم',
  },
  {
    id: 'FUSION',
    name: 'اندماج',
    nameEn: 'Fusion',
    icon: Flame,
    color:  '#f87171',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    desc:   'مقاتلو الاندماج بضربات نارية متفجرة',
  },
  {
    id: 'ELECTRO',
    name: 'كهرباء',
    nameEn: 'Electro',
    icon: Zap,
    color:  '#c084fc',
    bg:     'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.25)',
    desc:   'مقاتلو الكهرباء بصعقات متسلسلة هجومية',
  },
  {
    id: 'GLACIO',
    name: 'جليد',
    nameEn: 'Glacio',
    icon: Snowflake,
    color:  '#bfdbfe',
    bg:     'rgba(147,197,253,0.08)',
    border: 'rgba(147,197,253,0.25)',
    desc:   'مقاتلو الجليد بقدرات التجميد والتحكم بالخصم',
  },
  {
    id: 'HAVOC',
    name: 'فوضى',
    nameEn: 'Havoc',
    icon: Moon,
    color:  '#a78bfa',
    bg:     'rgba(107,33,168,0.08)',
    border: 'rgba(107,33,168,0.35)',
    desc:   'مقاتلو الفوضى بهجمات ظلال مدمرة',
  },
]

export default function ElementExplorer() {
  return (
    <section dir="rtl" className="section-gap relative overflow-hidden border-t border-white/[0.04]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)' }}
      />

      <div className="container-main relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent to-[#00c8ff]" />
            <span className="text-[#00c8ff] text-xs font-bold tracking-[0.2em] uppercase">العناصر</span>
            <div className="w-10 h-0.5 bg-gradient-to-l from-transparent to-[#00c8ff]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">استكشف العناصر</h2>
          <p className="text-[#4d6580] text-base max-w-xl mx-auto">
            تصفح الشخصيات حسب العنصر واعثر على الدليل المثالي لبنائك
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ELEMENTS.map((el, i) => (
            <motion.div
              key={el.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={`/characters?element=${el.id}`}
                className="group flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-2"
                style={{
                  background:  el.bg,
                  borderColor: el.border,
                }}
                onMouseEnter={e => {
                  const t = e.currentTarget as HTMLElement
                  t.style.boxShadow = `0 16px 40px rgba(0,0,0,0.6), 0 0 30px ${el.color}22`
                  t.style.background = `${el.bg.replace('0.08', '0.14')}`
                }}
                onMouseLeave={e => {
                  const t = e.currentTarget as HTMLElement
                  t.style.boxShadow = ''
                  t.style.background = el.bg
                }}
              >
                <el.icon
                  size={28}
                  className="mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: el.color }}
                />
                <div className="font-black text-white text-sm">{el.name}</div>
                <div className="text-[10px] text-[#4d6580] mt-0.5 latin">{el.nameEn}</div>
                <p className="text-[#4d6580] text-[11px] mt-2 leading-relaxed hidden sm:block">
                  {el.desc}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
