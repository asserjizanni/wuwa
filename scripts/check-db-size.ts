import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

function loadEnv(): void {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.resolve(process.cwd(), file)
    if (!fs.existsSync(fullPath)) continue
    for (const rawLine of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  }
}

loadEnv()

const prisma = new PrismaClient()

async function checkSize() {
  const tableSizes: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS external_and_index_size
    FROM pg_catalog.pg_statio_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;
  `)

  const dbSize: any[] = await prisma.$queryRawUnsafe(`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;
  `)

  const tupleStats: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      relname,
      n_live_tup,
      n_dead_tup,
      last_vacuum,
      last_autovacuum
    FROM pg_stat_user_tables
    WHERE relname = 'guide_pages';
  `)

  console.log('Database Size:', dbSize[0]?.db_size)
  console.log('Tuple Stats for guide_pages:', tupleStats)
  console.log('Top Table Sizes:')
  console.table(tableSizes.slice(0, 5))
}

checkSize()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
