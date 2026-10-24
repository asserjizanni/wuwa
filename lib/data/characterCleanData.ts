import fs from 'fs'
import path from 'path'

const CLEAN_DATA_FILE = path.join(process.cwd(), 'storage', 'data', 'characters_clean_full.json')

let cachedData: Record<string, any> | null = null

const ALIASES: Record<string, string> = {
  'the-shorekeeper': 'shorekeeper',
  'shorekeeper': 'shorekeeper',
  'camellia': 'camellya',
  'camellya': 'camellya',
  'jinshi': 'jinhsi',
  'jinhsi': 'jinhsi',
  'zhezi': 'zhezhi',
  'zhezhi': 'zhezhi',
  'yangyang-xuanling': 'xuanling',
  'xuanling': 'xuanling',
  'luuk': 'luukherssen',
  'luukherssen': 'luukherssen',
  'luce': 'lucy',
  'lucy': 'lucy',
  'aemeth': 'aemeath',
  'aemeath': 'aemeath',
  'boccia': 'roccia',
  'roccia': 'roccia',
  'rover': 'rover-electro',
}

export function getCleanCharacterBySlug(slug: string): any | null {
  if (!slug) return null
  const lower = slug.toLowerCase()
  const canonical = ALIASES[lower] || lower.replace(/^the-/, '')

  try {
    if (!cachedData && fs.existsSync(CLEAN_DATA_FILE)) {
      cachedData = JSON.parse(fs.readFileSync(CLEAN_DATA_FILE, 'utf8'))
    }
    if (cachedData) {
      return cachedData[canonical] || cachedData[lower] || null
    }
  } catch {}
  return null
}
