import type { Metadata } from 'next'
import TimelineClient from './TimelineClient'
import fallbackEvents from '@/lib/data/timelineEvents.json'

export const metadata: Metadata = {
  title: 'الجدول الزمني للأحداث — Wuthering Waves Builds',
}

export const revalidate = 3600 // Auto-revalidate every hour

export default function EventTimelinePage() {
  return (
    <div className="pt-[68px] min-h-screen flex flex-col bg-[#030508]" dir="rtl">
      {/* Page header */}
      <div className="border-b border-white/[0.05] relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,200,255,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="container-main py-6 relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-0.5 bg-[#00c8ff]" />
              <span className="text-[#00c8ff] text-[11px] font-bold tracking-[0.2em] uppercase">
                Event Timeline
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              الجدول الزمني للأحداث
            </h1>
          </div>
          <p className="text-[#8fa8c4] text-xs max-w-md leading-relaxed">
            بانرات الشخصيات، الأسلحة المحدودة، برج الشدائد، والفعاليات المباشرة — يتم التحديث تلقائياً.
          </p>
        </div>
      </div>

      {/* Native Interactive Timeline */}
      <TimelineClient initialEvents={fallbackEvents as any} />
    </div>
  )
}
