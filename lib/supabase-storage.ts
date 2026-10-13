import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const DEFAULT_STORAGE_BUCKET = process.env.MIGRATION_BUCKET || 'guide-images'

let supabaseAdminClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase admin client using the service role key.
 * Returns null if SUPABASE_URL or SUPABASE_SERVICE_KEY are not configured.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    return null
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return supabaseAdminClient
}

/** Check if Supabase Storage credentials are present in the environment */
export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
}

/** Build standard public CDN URL for an object in Supabase Storage */
export function buildPublicStorageUrl(bucket: string, objectPath: string): string {
  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`
}

/** Parse a data URL (e.g. data:image/webp;base64,...) into a Buffer and MIME type */
export function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    throw new Error('Invalid data-URL format')
  }
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

/**
 * Upload a binary buffer to Supabase Storage with retries and return the public URL.
 */
export async function uploadBufferToStorage({
  bucket = DEFAULT_STORAGE_BUCKET,
  path,
  buffer,
  contentType,
  upsert = true,
  maxRetries = 3,
}: {
  bucket?: string
  path: string
  buffer: Buffer
  contentType: string
  upsert?: boolean
  maxRetries?: number
}): Promise<string> {
  const client = getSupabaseAdminClient()
  if (!client) {
    throw new Error('Supabase Storage is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)')
  }

  let lastError: any = null
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await client.storage.from(bucket).upload(path, buffer, {
        contentType,
        upsert,
      })
      if (error) throw error

      return buildPublicStorageUrl(bucket, path)
    } catch (err: any) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  throw new Error(`Failed to upload to Supabase Storage [${bucket}/${path}]: ${lastError?.message || lastError}`)
}
