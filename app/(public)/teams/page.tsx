import { Metadata } from 'next'
import { prisma, safeDb } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Zap, Shield, ArrowLeft, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'تشكيلات الفرق الموصى بها | Wuthering Waves Teams',
  description: 'أفضل تشكيلات الفرق الموصى بها في لعبة ووذيرينغ ويفز، مع شرح أسلوب الروتيشن والكومبو وانسجام الشخصيات.',
}

export const revalidate = 60

export default async function TeamsPage() {
  const [teams, characters] = await Promise.all([
    safeDb(
      () =>
        prisma.teamComp.findMany({
          where: { isPublished: true },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        }),
      [],
      3500,
      'teams:list',
      300
    ),
    safeDb(
      () =>
        prisma.character.findMany({
          select: {
            slug: true,
            name: true,
            nameAr: true,
            portraitPath: true,
            element: true,
          },
        }),
      [],
      3500,
      'characters:for_teams',
      300
    ),
  ])

  const charMap = new Map<string, any>()
  for (const c of characters) {
    charMap.set(c.slug.toLowerCase(), c)
  }

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" dir="rtl">
      {/* Banner */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent p-8 border border-white/5 shadow-2xl">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-3">
            ⚔️ تناغم الشخصيات
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            تشكيلات الفرق <span className="text-gradient-cyan">Team Compositions</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            استعرض التشكيلات التنافسية المثبتة مع تفصيل دور كل شخصية (مهاجم رئيسي، مهاجم داعم، معالج ومزود طاقة) وتوجيهات أسلوب الروتيشن (Rotation) الصحيح.
          </p>
        </div>
      </div>

      {/* Teams List */}
      <div className="space-y-8">
        {teams.map((team) => {
          const members = (team.members as any[]) || []

          return (
            <div
              key={team.id}
              className="bg-[#080d1c] border border-white/10 hover:border-cyan-500/30 rounded-3xl p-6 sm:p-8 transition-all shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {team.isFeatured && (
                      <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                        ⭐ فريق مميز
                      </span>
                    )}
                    <h2 className="text-2xl font-black text-white">{team.titleAr || team.title}</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400">{team.descriptionAr || team.description}</p>
                </div>

                <Link
                  href="/builder"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-xs font-bold text-cyan-300 border border-white/10 transition-colors self-start sm:self-auto"
                >
                  <Users className="w-3.5 h-3.5" />
                  جرب في أداة بناء الفرق
                </Link>
              </div>

              {/* Members Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {members.map((member: any, idx: number) => {
                  const char = charMap.get(String(member.characterSlug || '').toLowerCase())
                  const name = char?.nameAr || char?.name || member.characterSlug
                  const image = char?.portraitPath

                  return (
                    <div key={idx} className="bg-[#040812] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                        <Image
                          src={image || `/images/characters/${member.characterSlug}.webp`}
                          alt={name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-cyan-400 block mb-0.5">
                          {member.roleAr || member.role}
                        </span>
                        <Link
                          href={`/characters/${member.characterSlug}`}
                          className="text-sm font-black text-white hover:text-cyan-300 truncate block transition-colors"
                        >
                          {name}
                        </Link>
                        {member.weapon && (
                          <p className="text-[11px] text-slate-400 truncate mt-1">
                            🗡️ السلاح: <span className="text-slate-300 font-medium">{member.weapon}</span>
                          </p>
                        )}
                        {member.echoSet && (
                          <p className="text-[11px] text-slate-400 truncate">
                            🔮 السوناتا: <span className="text-slate-300 font-medium">{member.echoSet}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Rotation Guide */}
              {(team.rotationGuideAr || team.rotationGuide) && (
                <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    دليل أسلوب الروتيشن والكومبو (Rotation Guide):
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {team.rotationGuideAr || team.rotationGuide}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
