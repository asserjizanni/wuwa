import Link from 'next/link'
import { Compass, Home, ChevronLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative" dir="rtl">
      {/* Background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle 600px at 50% 50%, rgba(0,200,255,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="w-20 h-20 rounded-3xl bg-[#00c8ff]/10 border border-[#00c8ff]/20 flex items-center justify-center mb-8 text-[#00c8ff] shadow-[0_0_50px_rgba(0,200,255,0.15)]">
        <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '12s' }} />
      </div>

      <div className="badge badge-cyan mb-4 text-xs font-mono">خطأ 404</div>

      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
        فُقد تردد الرنين
      </h1>

      <p className="text-[#8fa8c4] max-w-md mb-8 text-sm md:text-base leading-relaxed">
        الـ Resonator أو دليل البناء الذي تبحث عنه قد تلاشى في حقل تاست (Tacet Field) أو تم نقله إلى موقع آخر.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="btn btn-primary px-8 py-3.5 text-sm"
        >
          <Home className="w-4 h-4 ml-1" />
          العودة للرئيسية
        </Link>
        <Link
          href="/characters"
          className="btn btn-outline px-8 py-3.5 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          تصفح الشخصيات
        </Link>
      </div>
    </div>
  )
}
