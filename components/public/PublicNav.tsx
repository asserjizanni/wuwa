'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'

const NAV_LINKS = [
  { href: '/',                         label: 'الرئيسية' },
  { href: '/characters',               label: 'الشخصيات' },
  { href: '/weapons',                  label: 'الأسلحة' },


  { href: '/tier-list',                label: 'التصنيفات' },
  { href: '/teams',                    label: 'الفرق' },
  { href: '/timeline',                 label: 'الأحداث' },
  { href: '/builder',                  label: 'بناء الفريق' },
]

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobile, setMobile]     = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 25)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobile(false) }, [pathname])

  useEffect(() => {
    if (!mobile) return
    const fn = (e: MouseEvent) => {
      const el = document.getElementById('mobile-drawer')
      if (el && !el.contains(e.target as Node)) setMobile(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [mobile])

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#030508]/92 backdrop-blur-2xl border-b border-cyan-500/10 shadow-[0_8px_40px_rgba(0,0,0,0.7)]'
            : 'bg-gradient-to-b from-[#030508]/80 to-transparent backdrop-blur-md'
        }`}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-[72px]">

            {/* Character-Based Brand Logo */}
            <Link href="/" className="flex items-center gap-3.5 group shrink-0" aria-label="Wuthering Waves Builds">
              <div className="relative">
                <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-[#00c8ff] via-[#38bdf8] to-[#7c3aed] shadow-[0_0_20px_rgba(0,200,255,0.4)] group-hover:shadow-[0_0_28px_rgba(0,200,255,0.65)] transition-all duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-[#040812]">
                    <Image
                      src="/logo.png"
                      alt="Wuthering Waves Builds Logo"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      priority
                      sizes="40px"
                    />
                  </div>
                </div>
                <div className="absolute -inset-1 rounded-full bg-[#00c8ff] opacity-0 blur-md group-hover:opacity-30 transition-opacity duration-300 -z-10" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-black text-white tracking-tight">Wuthering Waves</span>
                  <span className="text-[11px] font-bold text-gradient-cyan">Builds</span>
                </div>
                <p className="text-[11px] font-semibold text-[#8fa8c4] group-hover:text-[#00c8ff] transition-colors mt-0.5">
                  وذرينق ويفز العربية
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5" dir="rtl">
              {NAV_LINKS.map((link) => {
                const isExact = pathname === link.href
                const isSub = link.href !== '/' && !link.href.includes('?') && pathname.startsWith(link.href)
                const active = isExact || isSub
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    className={`relative px-4 py-2 text-sm font-bold rounded-xl transition-colors duration-200 ${
                      active ? 'text-[#00c8ff]' : 'text-[#8fa8c4] hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-[rgba(0,200,255,0.12)] border border-[rgba(0,200,255,0.25)] shadow-[0_0_15px_rgba(0,200,255,0.1)]"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/builder"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#00c8ff] bg-[#00c8ff]/10 border border-[#00c8ff]/30 hover:bg-[#00c8ff]/20 hover:border-[#00c8ff]/50 shadow-[0_0_20px_rgba(0,200,255,0.15)] transition-all duration-200"
                id="nav-builder-btn"
              >
                <Zap size={14} className="text-[#00c8ff]" />
                <span>WuwaFlex</span>
              </Link>

              <button
                id="mobile-menu-btn"
                onClick={() => setMobile(v => !v)}
                className="md:hidden p-2.5 text-[#8fa8c4] hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/10 rounded-xl transition-all"
                aria-label="القائمة"
                aria-expanded={mobile}
              >
                {mobile ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden"
              onClick={() => setMobile(false)}
            />
            <motion.div
              id="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[290px] bg-[#060a14] border-l border-white/[0.08] md:hidden flex flex-col"
              dir="rtl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-br from-[#00c8ff] to-[#7c3aed]">
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      <Image src="/logo.png" alt="Logo" fill className="object-cover" sizes="36px" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Wuthering Waves Builds</p>
                    <p className="text-[10px] font-semibold text-[#00c8ff]">وذرينق ويفز العربية</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobile(false)}
                  className="p-2 text-[#8fa8c4] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 p-4 space-y-1.5">
                {NAV_LINKS.map((link, i) => {
                  const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        prefetch={false}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          active
                            ? 'bg-[rgba(0,200,255,0.12)] text-[#00c8ff] border border-[rgba(0,200,255,0.25)]'
                            : 'text-[#8fa8c4] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Drawer footer */}
              <div className="p-4 border-t border-white/[0.07] bg-[#03060c]">
                <Link
                  href="/builder"
                  className="btn btn-primary w-full justify-center text-sm py-3"
                  onClick={() => setMobile(false)}
                >
                  <Zap size={16} />
                  فتح WuwaFlex
                </Link>
                <p className="text-center text-[11px] text-[#4d6580] mt-3">
                  تطوير الموقع: Taleen
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
