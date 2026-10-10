import path from 'path'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'

export const STORAGE_ROOT = path.resolve(process.env.STORAGE_PATH || './storage')

export const STORAGE_PATHS = {
  root: STORAGE_ROOT,
  characters: path.join(STORAGE_ROOT, 'characters'),
  temp: path.join(STORAGE_ROOT, 'temp'),
}

export function getCharacterPaths(slug: string) {
  const base = path.join(STORAGE_PATHS.characters, slug)
  return {
    base,
    original: path.join(base, 'original'),
    guides: path.join(base, 'guides'),
    thumbnails: path.join(base, 'thumbnails'),
    portraits: path.join(base, 'portraits'),
  }
}

export function getGuidePaths(slug: string, version: number) {
  const versionStr = `v${version}`
  const char = getCharacterPaths(slug)
  return {
    dir: path.join(char.guides, versionStr),
    thumbnails: path.join(char.thumbnails, versionStr),
  }
}

export async function ensureStorageDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function initCharacterStorage(slug: string): Promise<void> {
  const paths = getCharacterPaths(slug)
  await Promise.all([
    ensureStorageDirectory(paths.base),
    ensureStorageDirectory(paths.original),
    ensureStorageDirectory(paths.guides),
    ensureStorageDirectory(paths.thumbnails),
    ensureStorageDirectory(paths.portraits),
  ])
}

export async function initBaseStorage(): Promise<void> {
  await Promise.all([
    ensureStorageDirectory(STORAGE_PATHS.characters),
    ensureStorageDirectory(STORAGE_PATHS.temp),
  ])
}

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200)
}

export function generateSlug(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
  return clean || `resonator-${Date.now().toString(36)}`
}

export function preventPathTraversal(base: string, filePath: string): string {
  const resolved = path.resolve(base, filePath)
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error('Path traversal detected')
  }
  return resolved
}

export function publicPathToStorage(publicPath: string): string {
  // Convert /storage/... URL paths to filesystem paths
  const relative = publicPath.replace(/^\/storage\//, '')
  return preventPathTraversal(STORAGE_ROOT, relative)
}

export function storagePathToPublic(fsPath: string): string {
  const relative = path.relative(STORAGE_ROOT, fsPath)
  return `/storage/${relative.replace(/\\/g, '/')}`
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function deleteFileIfExists(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch {
    // File doesn't exist, ignore
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stat = await fs.stat(filePath)
  return stat.size
}
