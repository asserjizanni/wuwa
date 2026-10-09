import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function elementToColor(element: string): string {
  const colors: Record<string, string> = {
    AERO: '#38bdf8',
    SPECTRO: '#fbbf24',
    FUSION: '#f87171',
    ELECTRO: '#c084fc',
    GLACIO: '#bfdbfe',
    HAVOC: '#a78bfa',
  }
  return colors[element] || '#a8b8cc'
}

export function elementToLabel(element: string): string {
  const labels: Record<string, string> = {
    AERO: 'Aero',
    SPECTRO: 'Spectro',
    FUSION: 'Fusion',
    ELECTRO: 'Electro',
    GLACIO: 'Glacio',
    HAVOC: 'Havoc',
  }
  return labels[element] || element
}

export function weaponToLabel(weapon: string): string {
  const labels: Record<string, string> = {
    BROADBLADE: 'Broadblade',
    SWORD: 'Sword',
    PISTOLS: 'Pistols',
    GAUNTLETS: 'Gauntlets',
    RECTIFIER: 'Rectifier',
  }
  return labels[weapon] || weapon
}

export function rarityToLabel(rarity: string): string {
  return rarity === 'FIVE_STAR' ? '5★' : '4★'
}

export function rarityToStars(rarity: string): number {
  return rarity === 'FIVE_STAR' ? 5 : 4
}
