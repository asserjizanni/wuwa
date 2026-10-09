'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Waves, Menu, X, Zap, Search } from 'lucide-react'

const NAV_LINKS = [
  { href: '/',          label: 'الرئيسية' },
  { href: '/characters', label: 'الشخصيات' },
  { href: '/builder',   label: 'منشئ البناء' },
  { href: '/search',    label: 'البحث' },
]

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobile, setMobile]     = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
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
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#030508]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_8px_48px_rgba(0,0,0,0.6)]'
            : 'bg-transparent'
        }`}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00c8ff] to-[#0055aa] flex items-center justify-center shadow-[0_0_20px_rgba(0,200,255,0.35)] group-hover:shadow-[0_0_32px_rgba(0,200,255,0.55)] transition-shadow duration-400">
                  <Waves size={18} className="text-[#020609]" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-[#00c8ff] opacity-0 blur-md group-hover:opacity-20 transition-opacity duration-400" />
              </div>
              <div className="leading-none">
                <p className="text-[13px] font-black text-white tracking-tight">Wuthering Waves</p>
                <p className="text-[10px] font-bold text-[#00c8ff] tracking-[0.2em] uppercase mt-0.5">بناء الشخصيات</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" dir="rtl">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                      active ? 'text-[#00c8ff]' : 'text-[#8fa8c4] hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-[rgba(0,200,255,0.1)] border border-[rgba(0,200,255,0.2)]"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/builder"
                className="hidden sm:inline-flex btn btn-primary py-2.5 px-5 text-sm"
                id="nav-builder-btn"
              >
                <Zap size={15} />
                <span>WuwaFlex</span>
              </Link>

              <Link
                href="/search"
                className="p-2.5 text-[#8fa8c4] hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200"
                aria-label="البحث"
              >
                <Search size={18} />
              </Link>

              <button
                id="mobile-menu-btn"
                onClick={() => setMobile(v => !v)}
                className="md:hidden p-2.5 text-[#8fa8c4] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
              onClick={() => setMobile(false)}
            />
            <motion.div
              id="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-[#0c1220] border-r border-white/[0.07] md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00c8ff] to-[#0055aa] flex items-center justify-center">
                    <Waves size={14} className="text-[#020609]" />
                  </div>
                  <span className="text-sm font-bold text-white">بناء WW</span>
                </div>
                <button
                  onClick={() => setMobile(false)}
                  className="p-2 text-[#8fa8c4] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 p-4 space-y-1">
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
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-[rgba(0,200,255,0.1)] text-[#00c8ff] border border-[rgba(0,200,255,0.2)]'
                            : 'text-[#8fa8c4] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-white/[0.07]">
                <Link href="/builder" className="btn btn-primary w-full justify-center">
                  <Zap size={16} />
                  فتح WuwaFlex Builder
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
