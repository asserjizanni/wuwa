import Link from 'next/link'
import Image from 'next/image'
import { Send, Heart } from 'lucide-react'

export default function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      dir="rtl"
      className="border-t border-white/[0.06] bg-[#03060c] relative overflow-hidden"
    >
      {/* Subtle top glow line */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background: 'linear-gradient(to left, transparent 5%, rgba(0,200,255,0.4) 40%, rgba(124,58,237,0.3) 60%, transparent 95%)',
        }}
      />

      <div className="container-main py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">

          {/* Brand & Community section */}
          <div className="md:col-span-6 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-[#00c8ff] via-[#38bdf8] to-[#7c3aed] shadow-[0_0_20px_rgba(0,200,255,0.3)] group-hover:shadow-[0_0_28px_rgba(0,200,255,0.5)] transition-shadow">
                <div className="w-full h-full rounded-full overflow-hidden relative bg-[#040812]">
                  <Image src="/logo.png" alt="Logo" fill className="object-cover" sizes="40px" />
                </div>
              </div>
              <div className="leading-tight">
                <div className="text-base font-black text-white">Wuthering Waves Builds</div>
                <div className="text-[11px] font-bold text-[#00c8ff] tracking-wide mt-0.5">وذرينق ويفز العربية</div>
              </div>
            </Link>

            <p className="text-[#8fa8c4] text-sm leading-relaxed max-w-md">
              منصة مجتمعية لعرض أدلة الشخصيات والبِلدات.
            </p>

            {/* Telegram Community Button */}
            <div className="pt-2">
              <a
                href="https://t.me/Wuthering_waves_arabic"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,136,204,0.15)] group"
              >
                <Send size={15} className="text-[#00c8ff] group-hover:translate-x-0.5 transition-transform" />
                <span>قروب تيليجرام: قروب وذرينق ويفز العربية</span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h3 className="text-white text-xs font-black mb-4 uppercase tracking-wider text-[#00c8ff]">تصفح</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/',                         label: 'الرئيسية' },
                { href: '/characters',                label: 'الشخصيات' },
                { href: '/characters?hasGuide=true', label: 'البِلدات' },
                { href: '/builder',                  label: 'WuwaFlex' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#8fa8c4] text-sm hover:text-[#00c8ff] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Credits & Community */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-white text-xs font-black mb-4 uppercase tracking-wider text-[#00c8ff]">عن الموقع</h3>
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>تطوير الموقع:</span>
              <span className="text-[#00c8ff] font-bold">Taleen</span>
            </p>
            <p className="text-xs text-[#8fa8c4] leading-relaxed">
              المجتمع العربي: <span className="text-white font-medium">وذرينق ويفز العربية</span>
            </p>
            <p className="text-xs text-[#8fa8c4] leading-relaxed">
              حقوق الموقع والمحتوى الأصلي الخاص به محفوظة لقروب وذرينق ويفز العربية.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4d6580]">
          <p>
            © {year} Wuthering Waves Builds · جميع الحقوق محفوظة لقروب وذرينق ويفز العربية
          </p>
          <p className="text-[11px] text-[#4d6580]">
            أصول وشخصيات Wuthering Waves هي علامات تجارية وحقوق ملكية تابعة لـ Kuro Games.
          </p>
        </div>
      </div>
    </footer>
  )
}
