import fs from 'fs'
import path from 'path'

const ALIASES: Record<string, string> = {
  'the-shorekeeper': 'shorekeeper',
  'camellia': 'camellya',
  'jinshi': 'jinhsi',
  'zhezi': 'zhezhi',
  'yangyang-xuanling': 'xuanling',
  'luuk': 'luukherssen',
  'luce': 'lucy',
  'aemeth': 'aemeath',
  'boccia': 'roccia',
  'rover': 'rover-electro',
}

export function getCharacterMainHtml(slug: string): string | null {
  if (!slug) return null
  const lower = slug.toLowerCase()
  const candidates = [
    lower,
    ALIASES[lower],
    lower.replace(/^the-/, ''),
    lower.replace(/-havoc$/, ''),
    lower.replace(/-spectro$/, ''),
    lower.replace(/-electro$/, ''),
  ].filter(Boolean) as string[]

  for (const c of candidates) {
    const filePath = path.join(process.cwd(), 'storage', 'data', 'character_mains', `${c}.html`)
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8')
      }
    } catch {}
  }
  return null
}
