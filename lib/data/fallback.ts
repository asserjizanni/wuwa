export interface CharacterFallback {
  id: string
  name: string
  nameEn: string
  slug: string
  element: 'AERO' | 'SPECTRO' | 'FUSION' | 'ELECTRO' | 'GLACIO' | 'HAVOC'
  weaponType: 'BROADBLADE' | 'SWORD' | 'PISTOLS' | 'GAUNTLETS' | 'RECTIFIER'
  rarity: 'FIVE_STAR' | 'FOUR_STAR'
  description: string
  portraitPath: string | null
  backgroundPath: string | null
  sortOrder: number
  isPublished: boolean
  tags: string[]
  guides: {
    id: string
    title: string
    version: number
    pageCount: number
    publishedAt: string
    pages?: {
      id: string
      pageNumber: number
      imagePath: string
      thumbnailPath: string | null
      width: number | null
      height: number | null
    }[]
  }[]
}

// Starting from clean zero — user will add characters via the control center
export const FALLBACK_CHARACTERS: CharacterFallback[] = []
