// =============================================================================
// API de Templates de Mensagem - listagem e criação
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const channel = searchParams.get('channel')?.trim()
    const where: any = {}
    if (channel && channel !== 'all') where.channel = channel
    const templates = await prisma.messageTemplate.findMany({ where, orderBy: { name: 'asc' } })
    return NextResponse.json(templates)
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const { name, slug, channel, subject, body: tplBody, event, active } = body
    if (!name || !slug || !tplBody) return apiError('Nome, slug e corpo são obrigatórios', 400)
    // Verificar duplicidade de slug
    const existing = await prisma.messageTemplate.findUnique({ where: { slug } })
    if (existing) return apiError('Já existe um template com esse slug', 400)
    const template = await prisma.messageTemplate.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        channel: channel || 'email',
        subject: subject || null,
        body: tplBody,
        event: event || null,
        active: active !== false,
      },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (e: any) { return apiError(e.message, 500) }
}
