// =============================================================================
// API de Upload - aceita multipart/form-data e retorna signed URL
// =============================================================================
// Recebe arquivos até ~10MB diretamente (logos, anexos pequenos).
// Para arquivos maiores, criar endpoint de presigned URL no futuro.
// =============================================================================
import { NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/api-helpers'
import { buildKey, uploadBuffer, getSignedDownloadUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder') as string) || 'uploads'

    if (!file) return apiError('Nenhum arquivo enviado', 400)
    if (file.size > MAX_SIZE) return apiError('Arquivo muito grande (máx 10MB)', 400)

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const cloud_storage_path = buildKey(folder, safeName)
    await uploadBuffer(cloud_storage_path, buffer, file.type || 'application/octet-stream')

    const url = await getSignedDownloadUrl(cloud_storage_path, 60 * 60 * 24 * 7)

    return NextResponse.json({ cloud_storage_path, url, size: file.size, type: file.type, name: file.name })
  } catch (err: any) {
    console.error('[UPLOAD]', err)
    return apiError('Erro ao enviar arquivo', 500)
  }
}
