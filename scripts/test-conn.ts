import { PrismaClient } from '@prisma/client'

async function test(name: string, url: string) {
  console.log(`Testing ${name}...`)
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  })
  try {
    const count = await prisma.character.count()
    console.log(`✅ ${name} SUCCESS: ${count} characters found`)
  } catch (err: any) {
    console.error(`❌ ${name} ERROR:`, err.message)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  await test('Port 6543 (pgbouncer)', 'postgresql://postgres.nxlmoqjskcgcrovqntbn:sahaba085231@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true')
  await test('Port 5432 (session)', 'postgresql://postgres.nxlmoqjskcgcrovqntbn:sahaba085231@aws-0-eu-west-2.pooler.supabase.com:5432/postgres')
}

main()
