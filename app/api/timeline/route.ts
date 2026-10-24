import { NextResponse } from 'next/server'
import fallbackEvents from '@/lib/data/timelineEvents.json'
import fs from 'fs'
import path from 'path'

export const revalidate = 3600 // Auto revalidate every hour

export interface TimelineEvent {
  name: string
  description?: string
  coverImgSrc?: string
  color?: string
  sourceUrl?: string
  startDate: string
  endDate: string
  isCstStart?: boolean
  banner?: {
    isBannerEvent: boolean
    group?: number
  }
}

export async function GET() {
  try {
    const res = await fetch('https://wuwatracker.com/timeline', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ events: fallbackEvents })
    }

    const html = await res.text()
    const parts = html.split('self.__next_f.push')
    const seen = new Set<string>()
    const allEvents: TimelineEvent[] = []

    for (const part of parts) {
      if (part.includes('startDate') && part.includes('endDate')) {
        let idx = 0
        while ((idx = part.indexOf('{\\"name\\":', idx + 1)) !== -1) {
          const raw = part.slice(idx)
          const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          const end = unescaped.indexOf('}]')
          if (end !== -1) {
            try {
              const evArray = JSON.parse('[' + unescaped.slice(0, end + 1) + ']')
              for (const e of evArray) {
                if (e.name && e.startDate && e.endDate && !seen.has(e.name + e.startDate)) {
                  seen.add(e.name + e.startDate)
                  if (e.coverImgSrc && e.coverImgSrc.startsWith('/')) {
                    e.coverImgSrc = 'https://wuwatracker.com' + e.coverImgSrc
                  }
                  allEvents.push(e)
                }
              }
            } catch {}
          }
        }
      }
    }

    if (allEvents.length > 0) {
      // Background save to local file so offline/SSR always has the freshest snapshot
      try {
        const filePath = path.join(process.cwd(), 'lib', 'data', 'timelineEvents.json')
        fs.writeFile(filePath, JSON.stringify(allEvents, null, 2), 'utf8', () => {})
      } catch {}

      return NextResponse.json({
        events: allEvents,
        updatedAt: new Date().toISOString(),
        source: 'live-wuwatracker',
      })
    }

    return NextResponse.json({
      events: fallbackEvents,
      updatedAt: new Date().toISOString(),
      source: 'cached',
    })
  } catch (err) {
    return NextResponse.json({
      events: fallbackEvents,
      updatedAt: new Date().toISOString(),
      source: 'fallback',
    })
  }
}
