/**
 * lib/blob-store.ts
 *
 * Stores guide page images in /tmp as JSON files.
 * On Netlify, /tmp is shared within a warm instance (~15 min window).
 * This is good enough: pages are fetched right after upload.
 *
 * For truly persistent storage, a DB (Supabase) or cloud blob store is needed.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

const PAGES_DIR = path.join(os.tmpdir(), 'wuwa-guide-pages')

function ensureDir() {
  try {
    if (!fs.existsSync(PAGES_DIR)) {
      fs.mkdirSync(PAGES_DIR, { recursive: true })
    }
  } catch {}
}

export interface StoredGuidePages {
  guideId: string
  pages: {
    pageNumber: number
    imagePath: string
    thumbnailPath: string
    width: number
    height: number
  }[]
}

/** Save guide pages to /tmp */
export async function saveGuidePages(data: StoredGuidePages): Promise<boolean> {
  try {
    ensureDir()
    const filePath = path.join(PAGES_DIR, `${data.guideId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8')
    return true
  } catch (err) {
    console.error('[blob-store] saveGuidePages error:', err)
    return false
  }
}

/** Load guide pages from /tmp */
export async function loadGuidePages(guideId: string): Promise<StoredGuidePages | null> {
  try {
    const filePath = path.join(PAGES_DIR, `${guideId}.json`)
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as StoredGuidePages
  } catch {
    return null
  }
}

/** Delete guide pages from /tmp */
export async function deleteGuidePages(guideId: string): Promise<void> {
  try {
    const filePath = path.join(PAGES_DIR, `${guideId}.json`)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {}
}
