import fs from 'fs'
import path from 'path'
import os from 'os'
import { FALLBACK_CHARACTERS, CharacterFallback } from './fallback'

declare global {
  // eslint-disable-next-line no-var
  var __cachedCharacters: CharacterFallback[] | undefined
  // eslint-disable-next-line no-var
  var __deletedCharacterIds: Set<string> | undefined
}

function getStoreDirs() {
  const localDir = path.join(process.cwd(), 'storage', 'data')
  const tmpDir = path.join(os.tmpdir(), 'wuwa-storage', 'data')
  return { localDir, tmpDir }
}

function getWritableFile(filename: string): string {
  const { localDir, tmpDir } = getStoreDirs()
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true })
    }
    const testFile = path.join(localDir, '.write-test')
    fs.writeFileSync(testFile, 'ok')
    fs.unlinkSync(testFile)
    return path.join(localDir, filename)
  } catch {
    // Read-only filesystem (e.g. Netlify/Lambda)
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }
      return path.join(tmpDir, filename)
    } catch {
      return path.join(os.tmpdir(), filename)
    }
  }
}

function getReadableFile(filename: string): string | null {
  const { localDir, tmpDir } = getStoreDirs()
  const localFile = path.join(localDir, filename)
  if (fs.existsSync(localFile)) return localFile

  const tmpFile = path.join(tmpDir, filename)
  if (fs.existsSync(tmpFile)) return tmpFile

  const fallbackTmp = path.join(os.tmpdir(), filename)
  if (fs.existsSync(fallbackTmp)) return fallbackTmp

  return null
}

function getDeletedIds(): Set<string> {
  if (global.__deletedCharacterIds) {
    return global.__deletedCharacterIds
  }

  const set = new Set<string>()
  try {
    const readable = getReadableFile('deleted-characters.json')
    if (readable) {
      const raw = fs.readFileSync(readable, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        parsed.forEach(id => set.add(String(id).toLowerCase()))
      }
    }
  } catch (err) {
    console.error('[characterStore] Error loading deleted ids:', err)
  }

  global.__deletedCharacterIds = set
  return set
}

function saveDeletedIds(set: Set<string>) {
  global.__deletedCharacterIds = set
  try {
    const target = getWritableFile('deleted-characters.json')
    fs.writeFileSync(target, JSON.stringify(Array.from(set), null, 2), 'utf-8')
  } catch (err) {
    console.error('[characterStore] Error saving deleted ids:', err)
  }
}

function loadFromDisk(): CharacterFallback[] {
  const deleted = getDeletedIds()
  try {
    const readable = getReadableFile('characters.json')
    if (readable) {
      const raw = fs.readFileSync(readable, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(
          c => !deleted.has(String(c.id).toLowerCase()) && !deleted.has(String(c.slug).toLowerCase())
        )
      }
    }
  } catch (err) {
    console.error('[characterStore] Error reading characters file:', err)
  }

  // Initialize with FALLBACK_CHARACTERS minus deleted ones
  const initial = JSON.parse(JSON.stringify(FALLBACK_CHARACTERS)).filter(
    (c: CharacterFallback) =>
      !deleted.has(String(c.id).toLowerCase()) && !deleted.has(String(c.slug).toLowerCase())
  )

  try {
    const target = getWritableFile('characters.json')
    fs.writeFileSync(target, JSON.stringify(initial, null, 2), 'utf-8')
  } catch (writeErr) {
    console.error('[characterStore] Failed to write initial characters:', writeErr)
  }

  return initial
}

function saveToDisk(characters: CharacterFallback[]) {
  try {
    const target = getWritableFile('characters.json')
    fs.writeFileSync(target, JSON.stringify(characters, null, 2), 'utf-8')
  } catch (err) {
    console.error('[characterStore] Error saving characters file:', err)
  }
}

export function getStoredCharacters(): CharacterFallback[] {
  if (!global.__cachedCharacters) {
    global.__cachedCharacters = loadFromDisk()
  }
  const deleted = getDeletedIds()
  return global.__cachedCharacters.filter(
    c => !deleted.has(String(c.id).toLowerCase()) && !deleted.has(String(c.slug).toLowerCase())
  )
}

export function getStoredCharacter(idOrSlug: string): CharacterFallback | null {
  const characters = getStoredCharacters()
  const lower = idOrSlug.toLowerCase()
  return (
    characters.find(
      c => c.id.toLowerCase() === lower || c.slug.toLowerCase() === lower
    ) || null
  )
}

export function createStoredCharacter(input: {
  name: string
  slug?: string
  element: 'AERO' | 'SPECTRO' | 'FUSION' | 'ELECTRO' | 'GLACIO' | 'HAVOC'
  weaponType: 'BROADBLADE' | 'SWORD' | 'PISTOLS' | 'GAUNTLETS' | 'RECTIFIER'
  rarity?: 'FIVE_STAR' | 'FOUR_STAR'
  description?: string | null
  sourceUrl?: string | null
  isPublished?: boolean
  isFeatured?: boolean
  tags?: string[]
  portraitPath?: string | null
  backgroundPath?: string | null
}): CharacterFallback {
  const characters = getStoredCharacters()
  const slug =
    input.slug ||
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    `resonator-${Date.now()}`

  // If this slug was in deleted ids, revive it
  const deleted = getDeletedIds()
  if (deleted.has(slug.toLowerCase())) {
    deleted.delete(slug.toLowerCase())
    saveDeletedIds(deleted)
  }

  const newChar: CharacterFallback = {
    id: `char-${Date.now()}`,
    name: input.name,
    nameEn: input.name,
    slug,
    element: input.element,
    weaponType: input.weaponType,
    rarity: input.rarity || 'FIVE_STAR',
    description: input.description || '',
    portraitPath: input.portraitPath || null,
    backgroundPath: input.backgroundPath || null,
    sortOrder: characters.length + 1,
    isPublished: input.isPublished ?? true,
    tags: input.tags || [],
    guides: [],
    ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
  } as any

  characters.unshift(newChar)
  global.__cachedCharacters = characters
  saveToDisk(characters)
  return newChar
}

export function updateStoredCharacter(
  idOrSlug: string,
  updates: Partial<CharacterFallback> & Record<string, any>
): CharacterFallback | null {
  const characters = getStoredCharacters()
  const lower = idOrSlug.toLowerCase()
  const index = characters.findIndex(
    c => c.id.toLowerCase() === lower || c.slug.toLowerCase() === lower
  )
  if (index === -1) return null

  const existing = characters[index]
  const updated: CharacterFallback = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  } as any

  characters[index] = updated
  global.__cachedCharacters = characters
  saveToDisk(characters)
  return updated
}

export function deleteStoredCharacter(idOrSlug: string): boolean {
  const characters = getStoredCharacters()
  const lower = idOrSlug.toLowerCase()
  const target = characters.find(
    c => c.id.toLowerCase() === lower || c.slug.toLowerCase() === lower
  )

  const deleted = getDeletedIds()
  deleted.add(lower)
  if (target) {
    deleted.add(target.id.toLowerCase())
    deleted.add(target.slug.toLowerCase())
  }
  saveDeletedIds(deleted)

  const filtered = characters.filter(
    c => c.id.toLowerCase() !== lower && c.slug.toLowerCase() !== lower
  )

  global.__cachedCharacters = filtered
  saveToDisk(filtered)
  return true
}

export function deleteStoredGuide(guideId: string): boolean {
  const characters = getStoredCharacters()
  let modified = false

  for (const char of characters) {
    if (char.guides && Array.isArray(char.guides)) {
      const initialCount = char.guides.length
      char.guides = char.guides.filter((g: any) => g.id !== guideId)
      if (char.guides.length !== initialCount) {
        modified = true
      }
    }
  }

  if (modified) {
    global.__cachedCharacters = characters
    saveToDisk(characters)
  }

  return modified
}

export function addStoredGuide(characterIdOrSlug: string, guideData: any): any {
  const characters = getStoredCharacters()
  const lower = characterIdOrSlug.toLowerCase()
  const char = characters.find(
    c => c.id.toLowerCase() === lower || c.slug.toLowerCase() === lower
  )
  if (!char) return null

  if (!char.guides) char.guides = []
  // If active, deactivate others
  if (guideData.isActive) {
    char.guides.forEach((g: any) => (g.isActive = false))
  }
  char.guides.unshift(guideData)

  global.__cachedCharacters = characters
  saveToDisk(characters)
  return guideData
}

export function publishStoredGuide(guideId: string): boolean {
  const characters = getStoredCharacters()
  let modified = false

  for (const char of characters) {
    if (char.guides && Array.isArray(char.guides)) {
      if (char.guides.some((g: any) => g.id === guideId)) {
        char.guides = char.guides.map((g: any) => {
          if (g.id === guideId) {
            return {
              ...g,
              status: 'PUBLISHED',
              isActive: true,
              publishedAt: new Date().toISOString(),
            }
          }
          return { ...g, isActive: false }
        })
        modified = true
      }
    }
  }

  if (modified) {
    global.__cachedCharacters = characters
    saveToDisk(characters)
  }

  return modified
}
