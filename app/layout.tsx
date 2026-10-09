import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Arabic, Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/common/ToastProvider'

// Arabic-first font stack
const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-arabic',
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
    default: 'بناء Wuthering Waves — دليل الشخصيات',
    template: '%s | بناء WW',
  },
  description: 'المرجع الأشمل لبنيات شخصيات Wuthering Waves — أدلة البناء الاحترافية ومحرر WuwaFlex في مكان واحد.',
  keywords: ['Wuthering Waves', 'WW builds', 'WuwaFlex', 'بنيات الشخصيات', 'أدلة البناء'],
  authors: [{ name: 'WW Builds Hub' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: 'بناء Wuthering Waves',
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
      className={`${notoArabic.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
