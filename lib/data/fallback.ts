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

export const FALLBACK_CHARACTERS: CharacterFallback[] = [
  {
    id: 'char-jinhsi',
    name: 'Jinhsi',
    nameEn: 'Jinhsi',
    slug: 'jinhsi',
    element: 'SPECTRO',
    weaponType: 'BROADBLADE',
    rarity: 'FIVE_STAR',
    description: 'حاكمة جينزهو (Magistrate of Jinzhou). تمتلك قوة الطيف الرنّانة وتستخدم السيف العريض في معارك حاسمة وفتاكة.',
    portraitPath: '/characters/jinhsi.jpg',
    backgroundPath: '/characters/jinhsi.jpg',
    sortOrder: 1,
    isPublished: true,
    tags: ['DPS', 'Spectro', 'Broadblade'],
    guides: [
      {
        id: 'guide-jinhsi-01',
        title: 'دليل بناء Jinhsi الشامل — أفضل الأطقم والأسلحة',
        version: 1,
        pageCount: 3,
        publishedAt: '2025-01-15T00:00:00Z',
        pages: [
          {
            id: 'page-jinhsi-1',
            pageNumber: 1,
            imagePath: '/characters/jinhsi.jpg',
            thumbnailPath: '/characters/jinhsi.jpg',
            width: 1080,
            height: 1440,
          },
          {
            id: 'page-jinhsi-2',
            pageNumber: 2,
            imagePath: '/characters/jinhsi.jpg',
            thumbnailPath: '/characters/jinhsi.jpg',
            width: 1080,
            height: 1440,
          },
          {
            id: 'page-jinhsi-3',
            pageNumber: 3,
            imagePath: '/characters/jinhsi.jpg',
            thumbnailPath: '/characters/jinhsi.jpg',
            width: 1080,
            height: 1440,
          },
        ],
      },
    ],
  },
  {
    id: 'char-changli',
    name: 'Changli',
    nameEn: 'Changli',
    slug: 'changli',
    element: 'FUSION',
    weaponType: 'SWORD',
    rarity: 'FIVE_STAR',
    description: 'مستشارة جينزهو السابقة ومعلمة جينهسي. متخصصة في عنصر الاندماج الناري واستخدام السيف الخفيف بهجمات انسيابية وسريعة.',
    portraitPath: '/characters/changli.jpg',
    backgroundPath: '/characters/changli.jpg',
    sortOrder: 2,
    isPublished: true,
    tags: ['Sub-DPS', 'Fusion', 'Sword'],
    guides: [
      {
        id: 'guide-changli-01',
        title: 'دليل بناء Changli — التركيبات القتالية والأسلحة المثالية',
        version: 1,
        pageCount: 2,
        publishedAt: '2025-01-20T00:00:00Z',
        pages: [
          {
            id: 'page-changli-1',
            pageNumber: 1,
            imagePath: '/characters/changli.jpg',
            thumbnailPath: '/characters/changli.jpg',
            width: 1080,
            height: 1440,
          },
          {
            id: 'page-changli-2',
            pageNumber: 2,
            imagePath: '/characters/changli.jpg',
            thumbnailPath: '/characters/changli.jpg',
            width: 1080,
            height: 1440,
          },
        ],
      },
    ],
  },
  {
    id: 'char-shorekeeper',
    name: 'Shorekeeper',
    nameEn: 'Shorekeeper',
    slug: 'shorekeeper',
    element: 'SPECTRO',
    weaponType: 'RECTIFIER',
    rarity: 'FIVE_STAR',
    description: 'حارسة الشواطئ السوداء (Keeper of the Black Shores). شخصية دعم وطاقة استثنائية بعنصر الطيف توفر تعزيزات حرجة وعلاجاً شاملاً.',
    portraitPath: '/characters/shorekeeper.jpg',
    backgroundPath: '/characters/shorekeeper.jpg',
    sortOrder: 3,
    isPublished: true,
    tags: ['Support', 'Spectro', 'Rectifier', 'Healer'],
    guides: [
      {
        id: 'guide-shorekeeper-01',
        title: 'دليل بناء Shorekeeper — أفضل دعم طيف وإيكوز الشواطئ',
        version: 1,
        pageCount: 2,
        publishedAt: '2025-02-01T00:00:00Z',
        pages: [
          {
            id: 'page-sk-1',
            pageNumber: 1,
            imagePath: '/characters/shorekeeper.jpg',
            thumbnailPath: '/characters/shorekeeper.jpg',
            width: 1080,
            height: 1440,
          },
          {
            id: 'page-sk-2',
            pageNumber: 2,
            imagePath: '/characters/shorekeeper.jpg',
            thumbnailPath: '/characters/shorekeeper.jpg',
            width: 1080,
            height: 1440,
          },
        ],
      },
    ],
  },
  {
    id: 'char-yinlin',
    name: 'Yinlin',
    nameEn: 'Yinlin',
    slug: 'yinlin',
    element: 'ELECTRO',
    weaponType: 'RECTIFIER',
    rarity: 'FIVE_STAR',
    description: 'المحققة السابقة في هوانغلونغ. شخصية صاعقة رنانة تدمج هجمات الدمية الكهربائية مع تعزيز هائل لهجمات التحرير والرنين.',
    portraitPath: null,
    backgroundPath: null,
    sortOrder: 4,
    isPublished: true,
    tags: ['Sub-DPS', 'Electro', 'Rectifier'],
    guides: [],
  },
  {
    id: 'char-jiyan',
    name: 'Jiyan',
    nameEn: 'Jiyan',
    slug: 'jiyan',
    element: 'AERO',
    weaponType: 'BROADBLADE',
    rarity: 'FIVE_STAR',
    description: 'قائد فرقة فرسان الرعد (Midnight Rangers). مقاتل هواء عنيف بسيفه العريض وقوة التنين الهوائي.',
    portraitPath: null,
    backgroundPath: null,
    sortOrder: 5,
    isPublished: true,
    tags: ['DPS', 'Aero', 'Broadblade'],
    guides: [],
  },
  {
    id: 'char-camellya',
    name: 'Camellya',
    nameEn: 'Camellya',
    slug: 'camellya',
    element: 'HAVOC',
    weaponType: 'SWORD',
    rarity: 'FIVE_STAR',
    description: 'زهرة الشواطئ السوداء الغامضة. مقاتلة فوضى بسيف خفيف تعتمد على سرعة حركاتها والتحليق الهوائي الفتاك.',
    portraitPath: null,
    backgroundPath: null,
    sortOrder: 6,
    isPublished: true,
    tags: ['DPS', 'Havoc', 'Sword'],
    guides: [],
  },
  {
    id: 'char-rover-havoc',
    name: 'Rover (Havoc)',
    nameEn: 'Rover (Havoc)',
    slug: 'rover-havoc',
    element: 'HAVOC',
    weaponType: 'SWORD',
    rarity: 'FIVE_STAR',
    description: 'البطل الرئيسي بقوة الفوضى. يتميز بضرر هائل وتحولات مهارية قوية.',
    portraitPath: null,
    backgroundPath: null,
    sortOrder: 7,
    isPublished: true,
    tags: ['DPS', 'Havoc', 'Sword'],
    guides: [],
  },
  {
    id: 'char-verina',
    name: 'Verina',
    nameEn: 'Verina',
    slug: 'verina',
    element: 'SPECTRO',
    weaponType: 'RECTIFIER',
    rarity: 'FIVE_STAR',
    description: 'طبيبة النباتات الموهوبة. تقدم علاجاً سريعاً وزيادة ضرر لجميع أعضاء الفريق.',
    portraitPath: null,
    backgroundPath: null,
    sortOrder: 8,
    isPublished: true,
    tags: ['Healer', 'Support', 'Spectro'],
    guides: [],
  },
]
