'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users,
  Settings, LogOut, ChevronRight, Shield, Menu, X, ExternalLink,
  Sparkles, Radio, Package, Trophy, Swords
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/control-center/dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard },
  { href: '/control-center/characters', label: 'الشخصيات', labelEn: 'Characters', icon: Users },
  { href: '/control-center/weapons', label: 'الأسلحة', labelEn: 'Weapons', icon: Shield },
  { href: '/control-center/echoes', label: 'الإيكو والسوناتا', labelEn: 'Echoes & Sets', icon: Sparkles },
  { href: '/control-center/tier-lists', label: 'التصنيفات (Tier List)', labelEn: 'Tier Lists', icon: Trophy },
  { href: '/control-center/teams', label: 'الفرق وتشكيلات القتال', labelEn: 'Teams & Comps', icon: Swords },
  { href: '/control-center/items', label: 'المواد والعناصر', labelEn: 'Items & Materials', icon: Package },
  { href: '/control-center/enemies', label: 'الأعداء والزعماء', labelEn: 'Enemies', icon: Radio },
  { href: '/control-center/settings', label: 'الإعدادات', labelEn: 'Settings', icon: Settings },
]

interface AdminSidebarProps {
  adminEmail?: string
  adminName?: string
  adminRole?: string
}

export default function AdminSidebar({ adminEmail, adminName, adminRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      toast.success('تم تسجيل الخروج بنجاح')
      window.location.href = '/control-center/login'
    } catch {
      toast.error('فشل تسجيل الخروج')
    }
  }

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE TOP NAVIGATION BAR (Visible on < 768px only)
          ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3.5 bg-[#050913]/90 backdrop-blur-xl border-b border-white/[0.08] w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation"
            className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-[#00c8ff] to-[#7c3aed] shadow-[0_0_12px_rgba(0,200,255,0.4)]">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image src="/logo.png" alt="Logo" fill className="object-cover" sizes="32px" />
              </div>
            </div>
            <div>
              <p className="text-white text-xs font-black tracking-wide leading-none">Control Center</p>
              <p className="text-[#00c8ff] text-[10px] font-bold tracking-wider uppercase mt-0.5">لوحة الإدارة</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-[#8fa8c4] hover:text-white transition-colors"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">الموقع</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8a32e] to-[#c2410c] flex items-center justify-center text-white text-xs font-bold shadow-[0_0_12px_rgba(232,163,46,0.3)]">
            {(adminName || 'A')[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE SLIDE-OVER DRAWER
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#070c18] border-r border-white/10 shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00c8ff] to-[#0055aa] flex items-center justify-center">
                    <Shield size={16} className="text-[#020609]" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-black">Control Center</p>
                    <p className="text-[#4d6580] text-[10px]">Wuthering Waves Hub</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#8fa8c4] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Admin profile in mobile drawer */}
              <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00c8ff] to-[#7c3aed] flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(0,200,255,0.2)]">
                    {(adminName || 'A')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-bold truncate">{adminName || 'مدير النظام'}</p>
                    <p className="text-[#4d6580] text-[11px] truncate font-mono">{adminEmail}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/control-center/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-[#00c8ff]/15 text-[#00c8ff] border border-[#00c8ff]/30 shadow-[0_0_20px_rgba(0,200,255,0.15)]'
                          : 'text-[#8fa8c4] hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-[#00c8ff]' : 'text-[#4d6580]'} />
                      <div className="flex-1 flex items-center justify-between">
                        <span>{item.label}</span>
                        <span className="text-[10px] text-[#4d6580] font-mono">{item.labelEn}</span>
                      </div>
                    </Link>
                  )
                })}
              </nav>

              {/* Drawer footer */}
              <div className="p-4 border-t border-white/[0.08] space-y-2">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-[#8fa8c4] hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                  معاينة الموقع الرئيسي
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={14} />
                  تسجيل الخروج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. DESKTOP PERMANENT SIDEBAR (Hidden on < 768px, visible on >= 768px)
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#060a15] border-r border-white/[0.07] min-h-screen sticky top-0 h-screen select-none z-30">
        {/* Brand */}
        <div className="p-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-[#00c8ff] via-[#38bdf8] to-[#7c3aed] shadow-[0_0_18px_rgba(0,200,255,0.4)] shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image src="/logo.png" alt="Logo" fill className="object-cover" sizes="40px" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-sm font-black tracking-wide">Control Center</p>
                <span className="px-1.5 py-0.2 rounded bg-[#00c8ff]/20 text-[#00c8ff] text-[9px] font-mono font-bold">PRO</span>
              </div>
              <p className="text-[#8fa8c4] text-xs mt-0.5 truncate">Wuthering Waves Hub</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00c8ff] to-[#7c3aed] flex items-center justify-center text-white text-xs font-black shadow-[0_0_12px_rgba(0,200,255,0.25)]">
                {(adminName || 'A')[0].toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#060a15]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate leading-tight">
                {adminName || 'مدير النظام'}
              </p>
              <p className="text-[#4d6580] text-[10px] truncate font-mono mt-0.5">
                {adminEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-[#4d6580] tracking-wider uppercase">
            إدارة المنصة
          </div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/control-center/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group relative ${
                  isActive
                    ? 'bg-[#00c8ff]/12 text-[#00c8ff] border border-[#00c8ff]/25 shadow-[0_0_20px_rgba(0,200,255,0.08)]'
                    : 'text-[#8fa8c4] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-active-bar"
                    className="absolute -left-3 top-2 bottom-2 w-1 bg-[#00c8ff] rounded-r-full shadow-[0_0_10px_#00c8ff]"
                  />
                )}
                <Icon size={16} className={isActive ? 'text-[#00c8ff]' : 'text-[#4d6580] group-hover:text-[#8fa8c4] transition-colors'} />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] text-[#4d6580] font-mono group-hover:text-[#8fa8c4]">{item.labelEn}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/[0.07] space-y-1.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#8fa8c4] hover:text-white hover:bg-white/[0.04] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink size={14} className="text-[#4d6580] group-hover:text-white" />
              <span>الموقع الرئيسي</span>
            </div>
            <span className="text-[10px] text-[#4d6580]">معاينة</span>
          </Link>

          <button
            onClick={handleLogout}
            id="admin-logout-btn"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  )
}
