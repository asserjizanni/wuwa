'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, FileImage, Activity, AlertCircle,
  CheckCircle2, Clock, Plus, RefreshCw, TrendingUp,
  Sparkles, ExternalLink, ShieldAlert, Cpu, ArrowUpRight
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DashboardData {
  stats: {
    totalCharacters: number
    publishedCharacters: number
    noGuideCharacters: number
    totalGuides: number
    publishedGuides: number
    totalPages: number
    pendingJobs: number
    failedJobs: number
  }
  recentGuides: any[]
  recentJobs: any[]
}

function StatCard({
  label,
  labelEn,
  value,
  icon: Icon,
  color,
  glowColor,
  trend,
}: {
  label: string
  labelEn: string
  value: number | string
  icon: any
  color: string
  glowColor: string
  trend?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(12,18,32,0.85) 0%, rgba(6,10,18,0.95) 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full pointer-events-none opacity-20 blur-2xl"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}35`,
            boxShadow: `0 0 16px ${glowColor}`,
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono"
            style={{
              background: `${color}15`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
          {value}
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <p className="text-white text-xs sm:text-sm font-bold truncate">
            {label}
          </p>
          <p className="text-[#4d6580] text-[10px] font-mono tracking-wide">
            {labelEn}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardClient() {
  const [data, setData]           = useState<DashboardData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadData() }, [])

  const refresh = () => {
    setRefreshing(true)
    loadData()
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-20 bg-white/[0.03] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER WITH TELEMETRY STATUS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#080d19] to-[#060a12] relative overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-56 h-56 rounded-full pointer-events-none opacity-20 blur-3xl bg-[#00c8ff]"
        />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-emerald-400 text-xs font-bold font-mono tracking-wider uppercase">
              System Online · مركز التحكم المتكامل
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            نظرة عامة على المنصة
          </h1>
          <p className="text-[#8fa8c4] text-xs sm:text-sm">
            متابعة إحصائيات الشخصيات، وأدلة البناء، ومهام المعالجة السحابية
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#8fa8c4] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:scale-95 transition-all"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#00c8ff]' : ''} />
            <span>تحديث</span>
          </button>
          <Link
            href="/control-center/characters/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#020609] bg-gradient-to-r from-[#00c8ff] to-[#0099ff] hover:opacity-95 shadow-[0_0_20px_rgba(0,200,255,0.3)] active:scale-95 transition-all"
          >
            <Plus size={15} />
            <span>إضافة شخصية</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CORE METRICS GRID (Responsive 1/2/4 cols)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#4d6580] tracking-wider uppercase flex items-center gap-2">
            <Cpu size={14} className="text-[#00c8ff]" />
            المؤشرات والإحصائيات الرئيسية
          </h2>
          <span className="text-[11px] text-[#4d6580] font-mono">Realtime Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="إجمالي الشخصيات"
            labelEn="Total Resonators"
            value={stats?.totalCharacters ?? 0}
            icon={Users}
            color="#00c8ff"
            glowColor="rgba(0,200,255,0.25)"
            trend="Active"
          />
          <StatCard
            label="الشخصيات المنشورة"
            labelEn="Published Public"
            value={stats?.publishedCharacters ?? 0}
            icon={TrendingUp}
            color="#10b981"
            glowColor="rgba(16,185,129,0.25)"
            trend="Live"
          />
          <StatCard
            label="أدلة البناء المتاحة"
            labelEn="Build Guides"
            value={stats?.publishedGuides ?? 0}
            icon={BookOpen}
            color="#e8a32e"
            glowColor="rgba(232,163,46,0.25)"
            trend="Guides"
          />
          <StatCard
            label="صفحات الأدلة المستخرجة"
            labelEn="Guide Pages"
            value={stats?.totalPages ?? 0}
            icon={FileImage}
            color="#a855f7"
            glowColor="rgba(168,85,247,0.25)"
            trend="Pages"
          />
        </div>

        {/* Secondary metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[#4d6580] font-medium">بدون دليل</p>
              <p className="text-lg font-black text-white">{stats?.noGuideCharacters ?? 0}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FileImage size={15} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[#4d6580] font-medium">إجمالي الأدلة</p>
              <p className="text-lg font-black text-white">{stats?.totalGuides ?? 0}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <BookOpen size={15} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[#4d6580] font-medium">مهام معالجة</p>
              <p className="text-lg font-black text-white">{stats?.pendingJobs ?? 0}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[#4d6580] font-medium">مهام متعثرة</p>
              <p className="text-lg font-black text-white">{stats?.failedJobs ?? 0}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RECENT GUIDES & JOBS PANELS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Recent guides */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#070c18] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BookOpen size={17} className="text-[#00c8ff]" />
                <h3 className="text-sm font-bold text-white">أحدث الأدلة المنشورة</h3>
              </div>
              <Link
                href="/control-center/guides"
                className="text-xs font-semibold text-[#00c8ff] hover:underline flex items-center gap-1"
              >
                <span>عرض الكل</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            {data?.recentGuides?.length === 0 ? (
              <div className="text-center py-10 text-[#4d6580] text-xs">
                لا توجد أدلة منشورة حالياً
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recentGuides?.map((guide: any) => (
                  <div
                    key={guide.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#00c8ff]/15 text-[#00c8ff] border border-[#00c8ff]/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {guide.character?.name || 'شخصية'}
                        </p>
                        <p className="text-[11px] text-[#8fa8c4] truncate max-w-xs">
                          {guide.title}
                        </p>
                      </div>
                    </div>
                    {guide.pageCount && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#4d6580] shrink-0">
                        {guide.pageCount} ص
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <Link
              href="/control-center/guides"
              className="text-xs text-[#8fa8c4] hover:text-white flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.02] border border-white/5 transition-colors"
            >
              <span>إدارة كافة أدلة الشخصيات</span>
            </Link>
          </div>
        </div>

        {/* Recent jobs */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#070c18] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Activity size={17} className="text-[#a855f7]" />
                <h3 className="text-sm font-bold text-white">مهام معالجة ملفات PDF</h3>
              </div>
              <Link
                href="/control-center/jobs"
                className="text-xs font-semibold text-[#a855f7] hover:underline flex items-center gap-1"
              >
                <span>عرض الكل</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            {data?.recentJobs?.length === 0 ? (
              <div className="text-center py-10 text-[#4d6580] text-xs">
                جميع مهام المعالجة مكتملة أو لا توجد مهام جارية
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recentJobs?.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        job.status === 'COMPLETED' ? 'bg-emerald-400' :
                        job.status === 'FAILED' ? 'bg-red-400' :
                        job.status === 'RUNNING' ? 'bg-amber-400 animate-pulse' :
                        'bg-[#4d6580]'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {job.character?.name || 'مهمة'}
                        </p>
                        <p className="text-[11px] text-[#4d6580]">{job.status} · {job.progress}%</p>
                      </div>
                    </div>
                    {job.status === 'FAILED' && (
                      <Link
                        href="/control-center/jobs"
                        className="text-xs text-red-400 hover:underline shrink-0"
                      >
                        إعادة المحاولة
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <Link
              href="/control-center/jobs"
              className="text-xs text-[#8fa8c4] hover:text-white flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.02] border border-white/5 transition-colors"
            >
              <span>مراقبة سير المعالجة السحابية</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. QUICK SHORTCUTS ROW
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#4d6580] tracking-wider uppercase">
          إجراءات وإدارة سريعة
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/control-center/characters/new"
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#00c8ff]/30 text-center transition-all group"
          >
            <Plus size={18} className="mx-auto mb-2 text-[#00c8ff] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">إضافة شخصية</span>
            <span className="text-[10px] text-[#4d6580]">Resonator جديد</span>
          </Link>

          <Link
            href="/control-center/characters"
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-emerald-500/30 text-center transition-all group"
          >
            <Users size={18} className="mx-auto mb-2 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">إدارة الشخصيات</span>
            <span className="text-[10px] text-[#4d6580]">تعديل وحذف ونشر</span>
          </Link>

          <Link
            href="/control-center/guides"
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-amber-500/30 text-center transition-all group"
          >
            <BookOpen size={18} className="mx-auto mb-2 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">أدلة الـ PDF</span>
            <span className="text-[10px] text-[#4d6580]">رفع واستخراج صفحات</span>
          </Link>

          <Link
            href="/control-center/settings"
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-purple-500/30 text-center transition-all group"
          >
            <Cpu size={18} className="mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">إعدادات الموقع</span>
            <span className="text-[10px] text-[#4d6580]">المعلمات واللغات</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
