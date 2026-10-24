import type { Metadata, Viewport } from 'next'
import { Tajawal, Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/common/ToastProvider'

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-latin',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#030508',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    default: 'Wuthering Waves Builds — أدلة الشخصيات والبِلدات',
    template: '%s | Wuthering Waves Builds',
  },
  description: 'منصة مجتمعية لعرض أدلة الشخصيات والبِلدات.',
  keywords: ['Wuthering Waves', 'WW builds', 'الشخصيات', 'البِلدات', 'الأسلحة', 'الإيكوز', 'التيرلست'],
  authors: [{ name: 'Taleen' }],
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: 'Wuthering Waves Builds',
    title: 'Wuthering Waves Builds — أدلة الشخصيات والبِلدات',
    description: 'منصة مجتمعية لعرض أدلة الشخصيات والبِلدات.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased bg-[#030508] text-[#eef4ff] font-[family-name:var(--font-tajawal)]"
        suppressHydrationWarning
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
