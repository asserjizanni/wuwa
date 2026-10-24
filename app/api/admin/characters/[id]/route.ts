import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import { FALLBACK_CHARACTERS } from '@/lib/data/fallback'
import {
  getStoredCharacter,
  updateStoredCharacter,
  deleteStoredCharacter,
} from '@/lib/data/characterStore'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameAr: z.string().max(100).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  element: z.enum(['AERO', 'SPECTRO', 'FUSION', 'ELECTRO', 'GLACIO', 'HAVOC']).optional(),
  weaponType: z.enum(['BROADBLADE', 'SWORD', 'PISTOLS', 'GAUNTLETS', 'RECTIFIER']).optional(),
  rarity: z.enum(['FOUR_STAR', 'FIVE_STAR']).optional(),
  description: z.string().max(2000).optional().nullable(),
  descriptionAr: z.string().max(5000).optional().nullable(),
  sourceUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  isPublished: z.boolean().optional(),
  isComingSoon: z.boolean().optional(),
  releaseVersion: z.string().max(20).optional().nullable(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  portraitPath: z.string().optional().nullable(),
  backgroundPath: z.string().optional().nullable(),
  stats: z.any().optional(),
  skills: z.any().optional(),
  sequences: z.any().optional(),
  ascensionMaterials: z.any().optional(),
  recommendedEchoes: z.any().optional(),
  teamComps: z.any().optional(),
  buildTips: z.string().optional().nullable(),
  skillMaterials: z.any().optional(),
  allMaterials: z.any().optional(),
  weaponsDPS: z.any().optional(),
  damageDistribution: z.any().optional(),
  teams: z.any().optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const character = await safeDb(
    () =>
      prisma.character.findUnique({
        where: { id },
      }),
    null
  )

  if (character) {
    const rawSkills = character.skills as any
    const talents = Array.isArray(rawSkills) ? rawSkills : (rawSkills?.talents || [])
    const sequences = (character as any).sequences || rawSkills?.sequences || []
    const rawStats = (character.stats as any) || {}
    const allMaterials = rawStats?.allMaterials || (character as any).allMaterials || []
    const damageDistribution = rawStats?.damageDistribution || (character as any).damageDistribution || null
    const weaponsDPS = character.recommendedWeapons || (character as any).weaponsDPS || []
    const teams = character.teamComps || (character as any).teams || []

    return NextResponse.json({
      character: {
        ...character,
        skills: talents,
        sequences,
        allMaterials,
        damageDistribution,
        weaponsDPS,
        teams,
      },
    })
  }

  // Fallback character from persistent store
  const fallback = getStoredCharacter(id)
  if (fallback) {
    const rawSkills = fallback.skills as any
    const talents = Array.isArray(rawSkills) ? rawSkills : (rawSkills?.talents || [])
    const sequences = (fallback as any).sequences || rawSkills?.sequences || []
    const rawStats = (fallback.stats as any) || {}
    const allMaterials = (fallback as any).allMaterials || rawStats?.allMaterials || []
    const damageDistribution = (fallback as any).damageDistribution || rawStats?.damageDistribution || null
    const weaponsDPS = (fallback as any).weaponsDPS || fallback.recommendedWeapons || []
    const teams = (fallback as any).teams || fallback.teamComps || []

    return NextResponse.json({
      character: {
        ...fallback,
        skills: talents,
        sequences,
        allMaterials,
        damageDistribution,
        weaponsDPS,
        teams,
      },
    })
  }

  return NextResponse.json({ error: 'Character not found' }, { status: 404 })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  // Sanitize: fallback session ID is not a real DB cuid — use null for audit log
  const auditAdminId = session.adminId && session.adminId !== 'admin-system-master' ? session.adminId : null

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const {
      sequences,
      weaponsDPS,
      teams,
      allMaterials,
      damageDistribution,
      ...restData
    } = data

    // Embed allMaterials and damageDistribution into stats JSON so they persist in DB
    let newStats = data.stats
    if (newStats !== undefined || allMaterials !== undefined || damageDistribution !== undefined) {
      const baseStats = typeof data.stats === 'object' && data.stats !== null ? data.stats : {}
      newStats = {
        ...baseStats,
        ...(allMaterials !== undefined ? { allMaterials } : {}),
        ...(damageDistribution !== undefined ? { damageDistribution } : {}),
      }
    }

    const prismaUpdateData: any = {
      ...restData,
      ...(newStats !== undefined ? { stats: newStats } : {}),
      sourceUrl: data.sourceUrl || null,
      updatedAt: new Date(),
    }

    if (data.skills !== undefined || sequences !== undefined) {
      prismaUpdateData.skills = {
        talents: Array.isArray(data.skills) ? data.skills : [],
        sequences: Array.isArray(sequences) ? sequences : [],
      }
    }

    if (weaponsDPS !== undefined) {
      prismaUpdateData.recommendedWeapons = weaponsDPS
    }
    if (teams !== undefined) {
      prismaUpdateData.teamComps = teams
    }

    const character = await safeDb(async () => {
      return prisma.$transaction(async (tx) => {
        const char = await tx.character.update({
          where: { id },
          data: prismaUpdateData,
        })

        await tx.auditLog.create({
          data: {
            adminUserId: auditAdminId,
            action: 'UPDATE_CHARACTER',
            targetType: 'Character',
            targetId: char.id,
            details: data as any,
          },
        })

        return char
      })
    }, null)

    const storeUpdates: any = {
      ...data,
      sourceUrl: data.sourceUrl || null,
    }
    if (sequences !== undefined) {
      storeUpdates.sequences = sequences
    }
    if (data.weaponsDPS !== undefined) {
      storeUpdates.weaponsDPS = data.weaponsDPS
      storeUpdates.recommendedWeapons = data.weaponsDPS
    }
    if (data.teams !== undefined) {
      storeUpdates.teams = data.teams
      storeUpdates.teamComps = data.teams
    }

    if (character) {
      updateStoredCharacter(id, storeUpdates)
      try {
        revalidatePath('/')
        revalidatePath('/characters')
        revalidatePath('/spin')
        if (character.slug) revalidatePath(`/characters/${character.slug}`)
      } catch {}
      return NextResponse.json({
        character: {
          ...character,
          skills: data.skills || character.skills,
          sequences: sequences || (character as any).sequences || [],
        },
      })
    }

    // Fallback response for offline or simulated updates
    const updated = updateStoredCharacter(id, storeUpdates)
    if (updated) {
      try {
        revalidatePath('/')
        revalidatePath('/characters')
        revalidatePath('/spin')
        if (updated.slug) revalidatePath(`/characters/${updated.slug}`)
      } catch {}
      return NextResponse.json({
        character: {
          ...updated,
          skills: data.skills || updated.skills,
          sequences: sequences || (updated as any).sequences || [],
        },
      })
    }

    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 422 })
    }
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const auditAdminId = session.adminId && session.adminId !== 'admin-system-master' ? session.adminId : null

  const body = await request.json().catch(() => ({}))
  if (body.confirm !== true) {
    return NextResponse.json(
      { error: 'Explicit confirmation required (confirm: true)' },
      { status: 400 }
    )
  }

  await safeDb(async () => {
    const character = await prisma.character.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    })

    if (character) {
      await prisma.$transaction(async (tx) => {
        await tx.character.delete({ where: { id } })
        if (auditAdminId) {
          await tx.auditLog.create({
            data: {
              adminUserId: auditAdminId,
              action: 'DELETE_CHARACTER',
              targetType: 'Character',
              targetId: id,
              details: { name: character.name, slug: character.slug },
            },
          }).catch(() => {})
        }
      })
    }
  }, null)

  deleteStoredCharacter(id)

  try {
    revalidatePath('/')
    revalidatePath('/characters')
    revalidatePath('/spin')
  } catch {}

  return NextResponse.json({ success: true, message: 'Character deleted successfully' })
}
