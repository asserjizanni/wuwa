'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Calendar,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Flame,
  LayoutGrid,
  ListFilter,
  Info,
  Timer,
  Navigation,
} from 'lucide-react'
import type { TimelineEvent } from '@/app/api/timeline/route'

interface TimelineClientProps {
  initialEvents: TimelineEvent[]
}

// Helper to route images through our local proxy to avoid 403 Cloudflare hotlink blocks
export function getProxiedImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('https://wuwatracker.com/')) {
    return `/api/timeline/image?url=${encodeURIComponent(src)}`
  }
  return src
}

export default function TimelineClient({ initialEvents }: TimelineClientProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents)
  const [activeFilter, setActiveFilter] = useState<'all' | 'banners' | 'events'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid')
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Mouse drag & wheel scrolling states
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const dragStartX = useRef(0)
  const dragStartScrollLeft = useRef(0)

  // 1. Mouse wheel horizontal scroll handler
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > 0) {
        scrollContainerRef.current.scrollLeft += e.deltaY * 1.4
      } else if (Math.abs(e.deltaX) > 0) {
        scrollContainerRef.current.scrollLeft += e.deltaX * 1.4
      }
    }
  }

  // 2. Mouse click & drag to pan (Grab & Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    if (e.button !== 0) return
    setIsDragging(true)
    setHasDragged(false)
    dragStartX.current = e.pageX - scrollContainerRef.current.offsetLeft
    dragStartScrollLeft.current = scrollContainerRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - dragStartX.current) * 1.4
    if (Math.abs(walk) > 4) {
      setHasDragged(true)
    }
    scrollContainerRef.current.scrollLeft = dragStartScrollLeft.current - walk
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
    setTimeout(() => setHasDragged(false), 50)
  }

  // Mount flag, clock updater & automatic background data sync
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)

    fetch('/api/timeline')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events)
        }
      })
      .catch(() => {})

    return () => clearInterval(timer)
  }, [])

  // Calculate daily & weekly resets
  const { dailyResetStr, weeklyResetStr } = useMemo(() => {
    if (!currentTime) return { dailyResetStr: '--h --m', weeklyResetStr: '--d --h' }
    const now = currentTime
    const nextDaily = new Date(now)
    nextDaily.setHours(4, 0, 0, 0)
    if (now.getHours() >= 4) {
      nextDaily.setDate(nextDaily.getDate() + 1)
    }
    const diffDaily = Math.max(0, nextDaily.getTime() - now.getTime())
    const dHours = Math.floor(diffDaily / (1000 * 60 * 60))
    const dMins = Math.floor((diffDaily % (1000 * 60 * 60)) / (1000 * 60))

    const nextWeekly = new Date(now)
    const day = nextWeekly.getDay()
    const daysUntilMon = (8 - day) % 7 || 7
    nextWeekly.setDate(nextWeekly.getDate() + daysUntilMon)
    nextWeekly.setHours(4, 0, 0, 0)
    if (day === 1 && now.getHours() < 4) {
      nextWeekly.setDate(now.getDate())
    }
    const diffWeekly = Math.max(0, nextWeekly.getTime() - now.getTime())
    const wDays = Math.floor(diffWeekly / (1000 * 60 * 60 * 24))
    const wHours = Math.floor((diffWeekly % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return {
      dailyResetStr: `${dHours}h ${dMins}m`,
      weeklyResetStr: `${wDays}d ${wHours}h`,
    }
  }, [currentTime])

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'banners') {
      return events.filter((e) => e.banner?.isBannerEvent || e.name.toLowerCase().includes('banner'))
    }
    if (activeFilter === 'events') {
      return events.filter((e) => !e.banner?.isBannerEvent && !e.name.toLowerCase().includes('banner'))
    }
    return events
  }, [events, activeFilter])

  // Responsive day column width
  const dayWidth = 40

  // Calculate the timeline date range
  const { startDate, totalDays, daysList, monthsList } = useMemo(() => {
    let minT = new Date('2026-09-15T00:00:00').getTime()
    let maxT = new Date('2026-11-20T23:59:59').getTime()

    for (const e of events) {
      const s = new Date(e.startDate.replace(' ', 'T')).getTime()
      const end = new Date(e.endDate.replace(' ', 'T')).getTime()
      if (!isNaN(s) && s < minT) minT = s
      if (!isNaN(end) && end > maxT) maxT = end
    }

    const start = new Date(minT)
    start.setHours(0, 0, 0, 0)
    const end = new Date(maxT)
    end.setHours(23, 59, 59, 999)

    const days: Date[] = []
    const cur = new Date(start)
    while (cur <= end) {
      days.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }

    const months: { name: string; count: number; startIdx: number }[] = []
    days.forEach((d, idx) => {
      const monthName = d.toLocaleDateString('en-US', { month: 'long' })
      const last = months[months.length - 1]
      if (!last || last.name !== monthName) {
        months.push({ name: monthName, count: 1, startIdx: idx })
      } else {
        last.count++
      }
    })

    return {
      startDate: start,
      endDate: end,
      totalDays: days.length,
      daysList: days,
      monthsList: months,
    }
  }, [events])

  // Today indicator position (rounded integer to prevent hydration mismatches)
  const todayPosition = useMemo(() => {
    if (!mounted || !currentTime) return null
    const diff = currentTime.getTime() - startDate.getTime()
    if (diff < 0) return null
    const dayFraction = diff / (1000 * 60 * 60 * 24)
    if (dayFraction > totalDays) return null
    return Math.round(dayFraction * dayWidth)
  }, [mounted, currentTime, startDate, totalDays, dayWidth])

  // Auto-scroll to Today once mounted
  useEffect(() => {
    if (todayPosition !== null && scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollLeft = Math.max(0, todayPosition - containerWidth / 3)
    }
  }, [todayPosition])

  const scrollToToday = () => {
    if (todayPosition !== null && scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, todayPosition - containerWidth / 3),
        behavior: 'smooth',
      })
    }
  }

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -dayWidth * 7, behavior: 'smooth' })
    }
  }
  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: dayWidth * 7, behavior: 'smooth' })
    }
  }

  // Calculate event bar position
  const getEventPosition = (ev: TimelineEvent) => {
    const s = new Date(ev.startDate.replace(' ', 'T')).getTime()
    const e = new Date(ev.endDate.replace(' ', 'T')).getTime()
    const startDiff = (s - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const endDiff = (e - startDate.getTime()) / (1000 * 60 * 60 * 24)

    const left = Math.max(0, Math.round(startDiff * dayWidth))
    const width = Math.max(dayWidth, Math.round((endDiff - Math.max(0, startDiff)) * dayWidth))

    return { left, width }
  }

  // Check event status
  const getEventStatus = (ev: TimelineEvent) => {
    const now = currentTime ? currentTime.getTime() : Date.now()
    const s = new Date(ev.startDate.replace(' ', 'T')).getTime()
    const e = new Date(ev.endDate.replace(' ', 'T')).getTime()

    if (now < s) {
      const diff = s - now
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      return {
        label: days > 0 ? `يبدأ خلال ${days} يوم` : 'يبدأ قريباً اليوم',
        active: false,
        upcoming: true,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      }
    }
    if (now > e) {
      return {
        label: 'منتهي',
        active: false,
        ended: true,
        badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      }
    }
    const diff = e - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return {
      label: days > 0 ? `متبقي ${days} يوم و ${hours} س` : `متبقي ${hours} ساعة`,
      active: true,
      upcoming: false,
      ended: false,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    }
  }

  return (
    <div className="w-full bg-[#030508] pb-16" dir="rtl">
      {/* ── Top Controls & Filter Bar ─────────────────────── */}
      <div className="container-main py-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          {/* Filter Pills + View Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#00c8ff] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض جدول التقويم"
              >
                <LayoutGrid size={13} />
                <span>تقويم</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-[#00c8ff] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض قائمة البطاقات للجوال"
              >
                <ListFilter size={13} />
                <span>بطاقات</span>
              </button>
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-white/10 shrink-0" />

            {/* Filters */}
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'all'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              الكل ({events.length})
            </button>
            <button
              onClick={() => setActiveFilter('banners')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'banners'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} className="text-[#00c8ff]" />
              البانرات
            </button>
            <button
              onClick={() => setActiveFilter('events')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'events'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={13} className="text-amber-400" />
              الفعاليات
            </button>
          </div>

          {/* Reset Badges & Navigation Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
            {/* Daily & Weekly Reset */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-slate-400">
                <Clock size={12} className="text-[#00c8ff]" />
                <span className="hidden sm:inline">الريسيت:</span>
                <span className="font-mono text-white font-bold">{dailyResetStr}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-slate-400">
                <Timer size={12} className="text-amber-400" />
                <span className="hidden sm:inline">الأسبوعي:</span>
                <span className="font-mono text-white font-bold">{weeklyResetStr}</span>
              </div>
            </div>

            {/* Calendar Controls (Only in Grid Mode) */}
            {viewMode === 'grid' && (
              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  onClick={scrollToToday}
                  className="px-2.5 py-1.5 rounded-lg bg-[#00c8ff]/10 hover:bg-[#00c8ff]/20 text-[#00c8ff] font-bold text-[11px] border border-[#00c8ff]/30 transition-colors flex items-center gap-1"
                >
                  <Navigation size={11} />
                  <span>اليوم</span>
                </button>
                <button
                  onClick={handleScrollLeft}
                  aria-label="Scroll left"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleScrollRight}
                  aria-label="Scroll right"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW 1: Cards View (Ultra Mobile-Friendly) ────── */}
      {viewMode === 'cards' && (
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((ev, idx) => {
              const status = getEventStatus(ev)
              const imgUrl = getProxiedImageUrl(ev.coverImgSrc)

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedEvent(ev)}
                  className="group relative rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-[#00c8ff]/40 overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg"
                >
                  {/* Banner Image */}
                  <div className="relative aspect-[21/9] w-full overflow-hidden bg-black/60">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={ev.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-bold text-sm text-white/60"
                        style={{ backgroundColor: ev.color || '#1e293b' }}
                      >
                        {ev.name}
                      </div>
                    )}
                    {/* Status Badge Over Image */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${status.badgeClass}`}
                      >
                        {status.active ? 'نشط الآن' : status.upcoming ? 'قريباً' : 'منتهي'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ev.color || '#00c8ff' }}
                        />
                        <span className="text-[11px] font-bold text-slate-400">
                          {ev.banner?.isBannerEvent ? 'بانر' : 'حدث'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white group-hover:text-[#00c8ff] transition-colors leading-snug">
                        {ev.name}
                      </h3>
                      {ev.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Dates & Countdown */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">{ev.startDate.split(' ')[0]}</span>
                      <span className="text-slate-600">←</span>
                      <span className="font-mono">{ev.endDate.split(' ')[0]}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.03] text-[11px] text-center font-bold text-[#00c8ff]">
                      {status.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── VIEW 2: Interactive Timeline Grid ─────────────── */}
      {viewMode === 'grid' && (
        <div className="container-main">
          <div
            ref={scrollContainerRef}
            dir="ltr"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`relative w-full overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#070b12] shadow-2xl select-none transition-all ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
            }}
          >
            <div
              className="relative"
              style={{
                width: `${totalDays * dayWidth}px`,
                minWidth: '100%',
              }}
            >
              {/* Month Header Row */}
              <div className="sticky top-0 z-30 flex border-b border-white/[0.08] bg-[#0c121d]">
                {monthsList.map((m, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 text-xs font-black uppercase tracking-wider text-[#00c8ff] border-r border-white/[0.08] flex items-center justify-between"
                    style={{ width: `${m.count * dayWidth}px` }}
                  >
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>

              {/* Day numbers & narrow day letters */}
              <div className="sticky top-[37px] z-30 flex border-b border-white/[0.08] bg-[#070b12]/95 backdrop-blur-md">
                {daysList.map((d, i) => {
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' })
                  const dayNum = d.getDate()
                  const isToday =
                    currentTime && d.toDateString() === currentTime.toDateString()
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6

                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center justify-center py-1.5 text-[11px] border-r border-white/[0.04] ${
                        isToday
                          ? 'bg-[#00c8ff]/20 text-[#00c8ff] font-bold'
                          : isWeekend
                          ? 'text-slate-400 bg-white/[0.01]'
                          : 'text-slate-300'
                      }`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      <span className="text-[10px] text-slate-500 font-medium">{dayName}</span>
                      <span
                        className={`text-xs ${
                          isToday ? 'font-black text-[#00c8ff]' : 'font-semibold'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Today's vertical time line */}
              {todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
                  style={{ left: `${todayPosition}px` }}
                >
                  <div className="sticky top-[73px] z-30 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/50 whitespace-nowrap animate-pulse">
                    {currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="w-[2px] h-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>
              )}

              {/* Events rows */}
              <div className="py-4 space-y-2.5 relative">
                {filteredEvents.map((ev, idx) => {
                  const pos = getEventPosition(ev)
                  const status = getEventStatus(ev)
                  const imgUrl = getProxiedImageUrl(ev.coverImgSrc)

                  return (
                    <div key={idx} className="relative h-10 w-full">
                      <div
                        onClick={() => {
                          if (!hasDragged) {
                            setSelectedEvent(ev)
                          }
                        }}
                        className={`absolute top-0 h-10 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:brightness-110 flex items-center overflow-hidden border shadow-lg group ${
                          status.active
                            ? 'border-white/20 shadow-black/60'
                            : 'border-white/10 opacity-75 hover:opacity-100'
                        }`}
                        style={{
                          left: `${pos.left}px`,
                          width: `${pos.width}px`,
                          backgroundColor: ev.color || '#1e293b',
                        }}
                      >
                        {/* Cover Image */}
                        {imgUrl && (
                          <div className="h-full w-14 shrink-0 overflow-hidden relative border-r border-white/20 bg-black/40">
                            <img
                              src={imgUrl}
                              alt={ev.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* Title & Badge */}
                        <div className="px-3 flex items-center gap-2 truncate text-white">
                          <span className="font-bold text-xs truncate drop-shadow-md">
                            {ev.name}
                          </span>
                          {status.active && (
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              نشط
                            </span>
                          )}
                        </div>

                        {/* Info icon */}
                        <div className="ml-auto pr-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/90">
                          <Info size={14} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Dialog: Event Details ──────────────────── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedEvent(null)}
          dir="rtl"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#0c121d] border border-white/15 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Banner Cover Image */}
            {selectedEvent.coverImgSrc && (
              <div className="rounded-xl overflow-hidden border border-white/10 aspect-[21/9] bg-black/50">
                <img
                  src={getProxiedImageUrl(selectedEvent.coverImgSrc)}
                  alt={selectedEvent.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedEvent.color || '#00c8ff' }}
                />
                <span className="text-xs font-bold text-[#00c8ff]">
                  {selectedEvent.banner?.isBannerEvent ? 'بانر خاص' : 'فعالية'}
                </span>
                {getEventStatus(selectedEvent).active && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    نشط الآن
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-white leading-snug">
                {selectedEvent.name}
              </h3>
            </div>

            {/* Date Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">تاريخ البدء</span>
                <span className="text-white font-mono font-bold">
                  {selectedEvent.startDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">تاريخ الانتهاء</span>
                <span className="text-white font-mono font-bold">
                  {selectedEvent.endDate}
                </span>
              </div>
            </div>

            {/* Status countdown */}
            <div className="p-3 rounded-xl bg-[#00c8ff]/10 border border-[#00c8ff]/20 text-xs font-bold text-[#00c8ff] flex items-center gap-2">
              <Clock size={15} />
              <span>الحالة: {getEventStatus(selectedEvent).label}</span>
            </div>

            {/* Description */}
            {selectedEvent.description && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-300">التفاصيل:</span>
                <p className="text-xs text-slate-400 leading-relaxed p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {/* Official Announcement Button */}
            {selectedEvent.sourceUrl && (
              <a
                href={selectedEvent.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#00c8ff] hover:bg-[#00b0e0] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00c8ff]/20"
              >
                <ExternalLink size={16} />
                قراءة الإعلان الرسمي على Kuro Games
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
