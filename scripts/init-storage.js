import fs from 'fs'
import path from 'path'

const CHARACTERS = [
  { name: 'Jinhsi', slug: 'jinhsi', element: 'SPECTRO', weaponType: 'BROADBLADE', rarity: 'FIVE_STAR', description: 'Magistrate of Jinzhou. A 5-star Spectro Broadblade character.' },
  { name: 'Changli', slug: 'changli', element: 'FUSION', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Sword character from Jinzhou.' },
  { name: 'Yinlin', slug: 'yinlin', element: 'ELECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'Adjudicator of Huanglong. A 5-star Electro Rectifier character.' },
  { name: 'Xiangli Yao', slug: 'xiangli-yao', element: 'ELECTRO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Electro Gauntlets character.' },
  { name: 'Zhezhi', slug: 'zhezhi', element: 'GLACIO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'A 5-star Glacio Rectifier character.' },
  { name: 'Jiyan', slug: 'jiyan', element: 'AERO', weaponType: 'BROADBLADE', rarity: 'FIVE_STAR', description: 'General of the Void Thunder Corps. A 5-star Aero Broadblade character.' },
  { name: 'Calcharo', slug: 'calcharo', element: 'ELECTRO', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Electro Sword character.' },
  { name: 'Encore', slug: 'encore', element: 'FUSION', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Rectifier character from Jinzhou.' },
  { name: 'Scar', slug: 'scar', element: 'FUSION', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Sword character.' },
  { name: 'Camellya', slug: 'camellya', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Havoc Sword character.' },
  { name: 'Roccia', slug: 'roccia', element: 'HAVOC', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Havoc Gauntlets character.' },
  { name: 'Carlotta', slug: 'carlotta', element: 'GLACIO', weaponType: 'PISTOLS', rarity: 'FIVE_STAR', description: 'A 5-star Glacio Pistols character.' },
  { name: 'Zani', slug: 'zani', element: 'SPECTRO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Spectro Gauntlets character.' },
  { name: 'Brant', slug: 'brant', element: 'FUSION', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Sword character.' },
  { name: 'Shorekeeper', slug: 'shorekeeper', element: 'SPECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'Keeper of Black Shores. A 5-star Spectro Rectifier support character.' },
  { name: 'Verina', slug: 'verina', element: 'SPECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'Guardian of Black Shores. A 5-star Spectro Rectifier healer.' },
  { name: 'Aalto', slug: 'aalto', element: 'AERO', weaponType: 'PISTOLS', rarity: 'FIVE_STAR', description: 'A 5-star Aero Pistols character.' },
  { name: 'Rover (Havoc)', slug: 'rover-havoc', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'The main protagonist — Havoc variant.' },
  { name: 'Rover (Spectro)', slug: 'rover-spectro', element: 'SPECTRO', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'The main protagonist — Spectro variant.' },
  { name: 'Rover (Aero)', slug: 'rover-aero', element: 'AERO', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'The main protagonist — Aero variant.' },
  { name: 'Chixia', slug: 'chixia', element: 'FUSION', weaponType: 'PISTOLS', rarity: 'FOUR_STAR', description: 'A 4-star Fusion Pistols character.' },
  { name: 'Danjin', slug: 'danjin', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FOUR_STAR', description: 'A 4-star Havoc Sword character.' },
  { name: 'Lingyang', slug: 'lingyang', element: 'GLACIO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Glacio Gauntlets character.' },
  { name: 'Mortefi', slug: 'mortefi', element: 'FUSION', weaponType: 'PISTOLS', rarity: 'FOUR_STAR', description: 'A 4-star Fusion Pistols character.' },
  { name: 'Sanhua', slug: 'sanhua', element: 'GLACIO', weaponType: 'SWORD', rarity: 'FOUR_STAR', description: 'A 4-star Glacio Sword character.' },
  { name: 'Taoqi', slug: 'taoqi', element: 'HAVOC', weaponType: 'BROADBLADE', rarity: 'FOUR_STAR', description: 'A 4-star Havoc Broadblade character.' },
  { name: 'Yangyang', slug: 'yangyang', element: 'AERO', weaponType: 'SWORD', rarity: 'FOUR_STAR', description: 'A 4-star Aero Sword character.' },
  { name: 'Yuanwu', slug: 'yuanwu', element: 'ELECTRO', weaponType: 'GAUNTLETS', rarity: 'FOUR_STAR', description: 'A 4-star Electro Gauntlets character.' },
  { name: 'Baizhi', slug: 'baizhi', element: 'GLACIO', weaponType: 'RECTIFIER', rarity: 'FOUR_STAR', description: 'A 4-star Glacio Rectifier healer.' },
  { name: 'Lumi', slug: 'lumi', element: 'GLACIO', weaponType: 'RECTIFIER', rarity: 'FOUR_STAR', description: 'A 4-star Glacio Rectifier character.' },
  { name: 'Jianxin', slug: 'jianxin', element: 'AERO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Aero Gauntlets character.' },
  { name: 'Phoebe', slug: 'phoebe', element: 'SPECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'A 5-star Spectro Rectifier character.' },
  { name: 'Cantarella', slug: 'cantarella', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Havoc Sword character.' },
  { name: 'Lupa', slug: 'lupa', element: 'FUSION', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Gauntlets character.' },
  { name: 'Cartethyia', slug: 'cartethyia', element: 'AERO', weaponType: 'PISTOLS', rarity: 'FIVE_STAR', description: 'A 5-star Aero Pistols character.' },
]

const baseStorage = path.resolve(process.cwd(), 'storage')
const charactersStorage = path.join(baseStorage, 'characters')

fs.mkdirSync(charactersStorage, { recursive: true })
fs.mkdirSync(path.join(baseStorage, 'temp'), { recursive: true })

console.log(`Initializing storage for ${CHARACTERS.length} Resonators at ${charactersStorage}...`)

for (const char of CHARACTERS) {
  const charDir = path.join(charactersStorage, char.slug)
  const subdirs = ['original', 'pages', 'thumbnails', 'portraits']
  
  for (const sub of subdirs) {
    fs.mkdirSync(path.join(charDir, sub), { recursive: true })
  }

  const metaPath = path.join(charDir, 'metadata.json')
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        name: char.name,
        slug: char.slug,
        element: char.element,
        weaponType: char.weaponType,
        rarity: char.rarity,
        description: char.description,
        source: 'Wuthering Waves Verified Hub Roster',
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  )
}

console.log(`✅ Dedicated storage folder initialized for all ${CHARACTERS.length} characters!`)
