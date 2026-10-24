'use client'

import Link from 'next/link'
import { Users, Shield, Trophy, Layers, Cpu, ArrowLeft } from 'lucide-react'

const DATABASES = [
  {
    href: '/characters',
    title: 'قاعدة الشخصيات',
    titleEn: 'Resonators Database',
    count: '48 شخصية',
    desc: 'استعرض جميع الشخصيات مع المهارات، الأدوار، ومسارات البناء المعتمدة.',
    icon: Users,
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/20 hover:border-cyan-400/60',
    iconColor: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    href: '/weapons',
    title: 'ترسانة الأسلحة',
    titleEn: 'Weapons Arsenal',
    count: '124 سلاح',
    desc: 'إحصائيات كاملة لجميع الأسلحة مع تأثيرات الترقية R1–R5 والتوافق.',
    icon: Shield,
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    border: 'border-amber-500/20 hover:border-amber-400/60',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },


  {
    href: '/tier-list',
    title: 'تصنيف الشخصيات (Tier List)',
    titleEn: 'Character Rankings',
    count: 'إصدار 1.4',
    desc: 'تصنيف شامل للشخصيات بحسب الأداء في برج الشدائد ومواجهات العالم.',
    icon: Trophy,
    gradient: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
    border: 'border-yellow-500/20 hover:border-yellow-400/60',
    iconColor: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  {
    href: '/teams',
    title: 'تشكيلات الفرق الموصى بها',
    titleEn: 'Team Compositions',
    count: 'أحدث التشكيلات',
    desc: 'أفضل الفرق التنافسية مع دليل الروتيشن والكومبو وانسجام المهارات.',
    icon: Layers,
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20 hover:border-emerald-400/60',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
]

export default function DatabaseDirectory() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" dir="rtl">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            مستودع البيانات الكامل
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
            استكشف موسوعة <span className="text-gradient-cyan">Wuthering Waves</span>
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            قواعد بيانات متكاملة ومترابطة تغطي كل جوانب اللعبة لتسهيل بناء أقوى الشخصيات والتجهيزات.
          </p>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DATABASES.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative rounded-3xl p-6 sm:p-7 bg-[#070c18] border ${item.border} bg-gradient-to-br ${item.gradient} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center ${item.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border border-white/5 ${item.badge}`}>
                    {item.count}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-3">{item.titleEn}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-cyan-300 transition-colors">
                <span>تصفح القاعدة</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
