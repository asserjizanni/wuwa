import Link from 'next/link'
import { Waves, ExternalLink } from 'lucide-react'

export default function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      dir="rtl"
      className="border-t border-white/[0.05] bg-[#080c14] relative overflow-hidden"
    >
      {/* Subtle top glow */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background: 'linear-gradient(to left, transparent 10%, rgba(0,200,255,0.3) 40%, rgba(232,163,46,0.3) 60%, transparent 90%)',
        }}
      />

      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00c8ff] to-[#0055aa] flex items-center justify-center shadow-[0_0_20px_rgba(0,200,255,0.3)] group-hover:shadow-[0_0_32px_rgba(0,200,255,0.5)] transition-shadow duration-300">
                <Waves size={20} className="text-[#020609]" />
              </div>
              <div className="leading-none">
                <div className="text-sm font-black text-white">Wuthering Waves</div>
                <div className="text-[10px] font-bold text-[#00c8ff] tracking-[0.2em] uppercase mt-0.5">بناء الشخصيات</div>
              </div>
            </Link>

            <p className="text-[#4d6580] text-sm leading-relaxed max-w-sm">
              مصدر مجتمعي لمحبي Wuthering Waves. استعرض بنيات الشخصيات
              وتصفح الأدلة واستخدم محرر WuwaFlex المدمج.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-white/[0.05]">
              <p className="text-[#4d6580] text-xs leading-relaxed">
                <span className="text-[#8fa8c4] font-semibold">تنبيه: </span>
                هذا موقع يُعدّه المجتمع وليس تابعاً لـ Kuro Games ولا معتمداً منهم رسمياً.
                جميع الأصول والعلامات التجارية ملكٌ لأصحابها.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <h3 className="text-white text-xs font-bold mb-5 uppercase tracking-[0.15em]">تصفح</h3>
            <ul className="space-y-3">
              {[
                { href: '/',           label: 'الرئيسية' },
                { href: '/characters', label: 'الشخصيات' },
                { href: '/builder',    label: 'منشئ البناء' },
                { href: '/search',     label: 'البحث' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#4d6580] text-sm hover:text-[#00c8ff] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-4">
            <h3 className="text-white text-xs font-bold mb-5 uppercase tracking-[0.15em]">روابط</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wuwaflex.com/builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4d6580] text-sm hover:text-[#00c8ff] transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <ExternalLink size={12} />
                  WuwaFlex Builder
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-[#4d6580] text-sm hover:text-[#00c8ff] transition-colors duration-200">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#4d6580] text-sm hover:text-[#00c8ff] transition-colors duration-200">
                  شروط الاستخدام
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#4d6580] text-xs">
            © {year} بناء Wuthering Waves. جميع الحقوق محفوظة.
          </p>
          <p className="text-[#4d6580] text-xs">
            هذا الموقع ليس تابعاً لـ{' '}
            <span className="text-[#8fa8c4] font-medium">Kuro Games</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
