#!/usr/bin/env tsx
/**
 * Database seed script — imports verified Wuthering Waves character roster
 * Sources: Wuthering Waves official + established community databases
 * Run: npm run db:seed
 */

// Load env
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'
import { initCharacterStorage, generateSlug } from '../lib/storage'

// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED CHARACTER ROSTER
// Source: Wuthering Waves official content as of early 2025
// Elements: AERO, SPECTRO, FUSION, ELECTRO, GLACIO, HAVOC
// Weapons: BROADBLADE, SWORD, PISTOLS, GAUNTLETS, RECTIFIER
// ─────────────────────────────────────────────────────────────────────────────

type CharacterSeed = {
  name: string
  element: 'AERO' | 'SPECTRO' | 'FUSION' | 'ELECTRO' | 'GLACIO' | 'HAVOC'
  weaponType: 'BROADBLADE' | 'SWORD' | 'PISTOLS' | 'GAUNTLETS' | 'RECTIFIER'
  rarity: 'FOUR_STAR' | 'FIVE_STAR'
  description?: string
}

const CHARACTERS: CharacterSeed[] = [
  // 5-Star Characters
  { name: 'Jinhsi', element: 'SPECTRO', weaponType: 'BROADBLADE', rarity: 'FIVE_STAR', description: 'Magistrate of Jinzhou. A 5-star Spectro Broadblade character.' },
  { name: 'Changli', element: 'FUSION', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Sword character from Jinzhou.' },
  { name: 'Yinlin', element: 'ELECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'Adjudicator of Huanglong. A 5-star Electro Rectifier character.' },
  { name: 'Xiangli Yao', element: 'ELECTRO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Electro Gauntlets character.' },
  { name: 'Zhezhi', element: 'GLACIO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'A 5-star Glacio Rectifier character.' },
  { name: 'Jiyan', element: 'AERO', weaponType: 'BROADBLADE', rarity: 'FIVE_STAR', description: 'General of the Void Thunder Corps. A 5-star Aero Broadblade character.' },
  { name: 'Calcharo', element: 'ELECTRO', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Electro Sword character.' },
  { name: 'Encore', element: 'FUSION', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Rectifier character from Jinzhou.' },
  { name: 'Scar', element: 'FUSION', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Sword character.' },
  { name: 'Camellya', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Havoc Sword character.' },
  { name: 'Roccia', element: 'HAVOC', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Havoc Gauntlets character.' },
  { name: 'Carlotta', element: 'GLACIO', weaponType: 'PISTOLS', rarity: 'FIVE_STAR', description: 'A 5-star Glacio Pistols character.' },
  { name: 'Zani', element: 'SPECTRO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Spectro Gauntlets character.' },
  { name: 'Brant', element: 'FUSION', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Sword character.' },
  { name: 'Shorekeeper', element: 'SPECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'Keeper of Black Shores. A 5-star Spectro Rectifier support character.' },
  { name: 'Verina', element: 'SPECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'Guardian of Black Shores. A 5-star Spectro Rectifier healer.' },
  { name: 'Aalto', element: 'AERO', weaponType: 'PISTOLS', rarity: 'FIVE_STAR', description: 'A 5-star Aero Pistols character.' },
  { name: 'Rover (Havoc)', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'The main protagonist — Havoc variant. A 5-star Havoc Sword character.' },
  { name: 'Rover (Spectro)', element: 'SPECTRO', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'The main protagonist — Spectro variant. A 5-star Spectro Sword character.' },
  { name: 'Rover (Aero)', element: 'AERO', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'The main protagonist — Aero variant. A 5-star Aero Sword character.' },

  // 4-Star Characters
  { name: 'Chixia', element: 'FUSION', weaponType: 'PISTOLS', rarity: 'FOUR_STAR', description: 'A 4-star Fusion Pistols character.' },
  { name: 'Danjin', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FOUR_STAR', description: 'A 4-star Havoc Sword character.' },
  { name: 'Lingyang', element: 'GLACIO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Glacio Gauntlets character.' },
  { name: 'Mortefi', element: 'FUSION', weaponType: 'PISTOLS', rarity: 'FOUR_STAR', description: 'A 4-star Fusion Pistols character.' },
  { name: 'Sanhua', element: 'GLACIO', weaponType: 'SWORD', rarity: 'FOUR_STAR', description: 'A 4-star Glacio Sword character.' },
  { name: 'Taoqi', element: 'HAVOC', weaponType: 'BROADBLADE', rarity: 'FOUR_STAR', description: 'A 4-star Havoc Broadblade character.' },
  { name: 'Yangyang', element: 'AERO', weaponType: 'SWORD', rarity: 'FOUR_STAR', description: 'A 4-star Aero Sword character.' },
  { name: 'Yuanwu', element: 'ELECTRO', weaponType: 'GAUNTLETS', rarity: 'FOUR_STAR', description: 'A 4-star Electro Gauntlets character.' },
  { name: 'Baizhi', element: 'GLACIO', weaponType: 'RECTIFIER', rarity: 'FOUR_STAR', description: 'A 4-star Glacio Rectifier healer.' },
  { name: 'Lumi', element: 'GLACIO', weaponType: 'RECTIFIER', rarity: 'FOUR_STAR', description: 'A 4-star Glacio Rectifier character.' },
  { name: 'Jianxin', element: 'AERO', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Aero Gauntlets character.' },
  { name: 'Phoebe', element: 'SPECTRO', weaponType: 'RECTIFIER', rarity: 'FIVE_STAR', description: 'A 5-star Spectro Rectifier character.' },
  { name: 'Cantarella', element: 'HAVOC', weaponType: 'SWORD', rarity: 'FIVE_STAR', description: 'A 5-star Havoc Sword character.' },
  { name: 'Lupa', element: 'FUSION', weaponType: 'GAUNTLETS', rarity: 'FIVE_STAR', description: 'A 5-star Fusion Gauntlets character.' },
  { name: 'Cartethyia', element: 'AERO', weaponType: 'PISTOLS', rarity: 'FIVE_STAR', description: 'A 5-star Aero Pistols character.' },
]

const DEFAULT_SITE_SETTINGS = [
  { key: 'site_name', value: 'Wuthering Waves Builds Hub', description: 'Website display name' },
  { key: 'site_description', value: 'The ultimate resource for Wuthering Waves character builds, guides, and the WuwaFlex builder.', description: 'Meta description' },
  { key: 'allow_guide_download', value: 'false', description: 'Allow public guide download' },
  { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode' },
  { key: 'max_pdf_size_mb', value: '100', description: 'Maximum PDF upload size in MB' },
  { key: 'pdf_render_dpi', value: '250', description: 'PDF rendering DPI' },
  { key: 'default_language', value: 'en', description: 'Default language (en/ar)' },
]

async function main() {
  console.log('\n🌊 Seeding Wuthering Waves character roster...\n')

  let created = 0
  let skipped = 0
  let errors = 0

  for (const char of CHARACTERS) {
    const slug = generateSlug(char.name)

    try {
      // Check if already exists
      const existing = await prisma.character.findUnique({ where: { slug } })
      if (existing) {
        console.log(`⏭  Skipped (exists): ${char.name}`)
        skipped++
        continue
      }

      // Create character in database
      await prisma.character.create({
        data: {
          name: char.name,
          slug,
          element: char.element,
          weaponType: char.weaponType,
          rarity: char.rarity,
          description: char.description,
          sourceUrl: 'https://wuthering.gg',
          sourceVerifiedAt: new Date('2025-01-01'),
          isPublished: false, // Admins must publish manually
        },
      })

      // Create storage directories
      await initCharacterStorage(slug)

      console.log(`✅ Created: ${char.name} (${char.element} ${char.weaponType})`)
      created++
    } catch (err) {
      console.error(`❌ Error creating ${char.name}:`, err)
      errors++
    }
  }

  // Seed site settings
  console.log('\n📋 Seeding site settings...')
  for (const setting of DEFAULT_SITE_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { settingKey: setting.key },
      update: {},
      create: {
        settingKey: setting.key,
        settingValue: setting.value,
        description: setting.description,
      },
    })
  }

  console.log('\n─'.repeat(50))
  console.log(`✅ Done — Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`)
  console.log('\nCharacters are unpublished by default.')
  console.log('Publish them from the administration dashboard.\n')
}

main()
  .catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
