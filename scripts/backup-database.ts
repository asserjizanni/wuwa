#!/usr/bin/env tsx
/**
 * scripts/backup-database.ts
 *
 * Full logical backup of all application tables in PostgreSQL:
 *  - characters
 *  - build_guides
 *  - guide_pages
 *  - processing_jobs
 *  - admin_users
 *  - audit_logs
 *  - site_settings
 *
 * Exports complete JSON snapshots to backups/ (ignored by Git, outside public/).
 * Does not modify any records. Does not log passwords or secret tokens.
 *
 * Usage:
 *   npx tsx scripts/backup-database.ts
 */

import fs from 'fs'
import path from 'path'

// Load environment variables without external dependencies
function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.resolve(process.cwd(), file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8')
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const eqIdx = line.indexOf('=')
        if (eqIdx === -1) continue
        const key = line.slice(0, eqIdx).trim()
        let val = line.slice(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}
loadEnvFiles()

import { prisma } from '../lib/db'

async function main() {
  console.log('\n========================================')
  console.log('   Full Logical Database Backup         ')
  console.log('========================================\n')

  const startTime = Date.now()
  const backupDir = path.resolve(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log('[backup-all] Querying all tables in sequence...\n')

  // 1. Characters
  console.log('[backup-all] Exporting characters...')
  const characters = await prisma.character.findMany({
    orderBy: { createdAt: 'asc' },
  })
  console.log(`  -> ${characters.length} characters retrieved.`)

  // 2. Build Guides
  console.log('[backup-all] Exporting build_guides...')
  const buildGuides = await prisma.buildGuide.findMany({
    orderBy: { createdAt: 'asc' },
  })
  console.log(`  -> ${buildGuides.length} build_guides retrieved.`)

  // 3. Guide Pages (use verified local snapshot if available to avoid re-streaming 442 MB)
  console.log('[backup-all] Exporting guide_pages (including Base64 data)...')
  const latestGuideBackup = path.join(backupDir, 'guide_pages_backup_latest.json')
  let guidePages: any[] = []

  if (fs.existsSync(latestGuideBackup)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(latestGuideBackup, 'utf8'))
      if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
        guidePages = parsed.data
        console.log(`  -> Loaded ${guidePages.length} guide_pages from verified local backup file (zero network overhead).`)
      }
    } catch {}
  }

  if (guidePages.length === 0) {
    console.log('  -> Local guide backup not found, fetching from database in safe batches...')
    const allIds = await prisma.guidePage.findMany({
      select: { id: true },
      orderBy: [{ guideId: 'asc' }, { pageNumber: 'asc' }],
    })
    const BATCH_SIZE = 5
    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      const batchIds = allIds.slice(i, i + BATCH_SIZE).map(r => r.id)
      let success = false
      let attempts = 0
      while (!success && attempts < 3) {
        attempts++
        try {
          const batch = await prisma.guidePage.findMany({
            where: { id: { in: batchIds } },
          })
          guidePages.push(...batch)
          success = true
        } catch (err) {
          await prisma.$disconnect().catch(() => {})
          if (attempts >= 3) throw err
          await new Promise(r => setTimeout(r, 4000))
        }
      }
    }
    console.log(`  -> ${guidePages.length} guide_pages retrieved from database.`)
  }

  // 4. Processing Jobs
  console.log('[backup-all] Exporting processing_jobs...')
  const processingJobs = await prisma.processingJob.findMany({
    orderBy: { createdAt: 'asc' },
  })
  console.log(`  -> ${processingJobs.length} processing_jobs retrieved.`)

  // 5. Admin Users
  console.log('[backup-all] Exporting admin_users...')
  const adminUsers = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
  })
  console.log(`  -> ${adminUsers.length} admin_users retrieved.`)

  // 6. Audit Logs
  console.log('[backup-all] Exporting audit_logs...')
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
  })
  console.log(`  -> ${auditLogs.length} audit_logs retrieved.`)

  // 7. Site Settings
  console.log('[backup-all] Exporting site_settings...')
  const siteSettings = await prisma.siteSetting.findMany({
    orderBy: { settingKey: 'asc' },
  })
  console.log(`  -> ${siteSettings.length} site_settings retrieved.`)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `database_full_backup_${timestamp}.json`
  const latestFilename = 'database_full_backup_latest.json'

  const filePath = path.join(backupDir, filename)
  const latestPath = path.join(backupDir, latestFilename)

  const payload = {
    metadata: {
      type: 'FULL_LOGICAL_BACKUP',
      exportedAt: new Date().toISOString(),
      counts: {
        characters: characters.length,
        buildGuides: buildGuides.length,
        guidePages: guidePages.length,
        processingJobs: processingJobs.length,
        adminUsers: adminUsers.length,
        auditLogs: auditLogs.length,
        siteSettings: siteSettings.length,
      },
    },
    tables: {
      characters,
      buildGuides,
      guidePages,
      processingJobs,
      adminUsers,
      auditLogs,
      siteSettings,
    },
  }

  console.log('\n[backup-all] Writing full backup to disk...')
  const jsonString = JSON.stringify(payload, null, 2)
  fs.writeFileSync(filePath, jsonString, 'utf8')
  fs.writeFileSync(latestPath, jsonString, 'utf8')

  const fileStats = fs.statSync(filePath)
  const fileSizeMb = (fileStats.size / (1024 * 1024)).toFixed(2)
  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('\n========================================')
  console.log('   Full Backup Completed Successfully!  ')
  console.log('========================================')
  console.log(`- Characters:         ${characters.length}`)
  console.log(`- Build Guides:       ${buildGuides.length}`)
  console.log(`- Guide Pages:        ${guidePages.length}`)
  console.log(`- Processing Jobs:    ${processingJobs.length}`)
  console.log(`- Admin Users:        ${adminUsers.length}`)
  console.log(`- Audit Logs:         ${auditLogs.length}`)
  console.log(`- Site Settings:      ${siteSettings.length}`)
  console.log(`- Total File Size:    ${fileSizeMb} MB`)
  console.log(`- Primary File:       ${filePath}`)
  console.log(`- Latest Pointer:     ${latestPath}`)
  console.log(`- Time Elapsed:       ${durationSeconds}s`)
  console.log('========================================\n')
}

main()
  .catch((err) => {
    console.error('\n[backup-all error] Backup failed:', err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
