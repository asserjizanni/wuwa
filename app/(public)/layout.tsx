import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import MusicPlayer from '@/components/audio/MusicPlayer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#030508] text-[#eef4ff]">
      <PublicNav />
      <main className="flex-1">
        {children}
      </main>
      <MusicPlayer />
      <PublicFooter />
    </div>
  )
}
