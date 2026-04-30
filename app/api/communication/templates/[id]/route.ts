// =============================================================================
// API de Template individual - GET / PATCH / DELETE
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const tpl = await prisma.messageTemplate.findUnique({ where: { id: params.id }, include: { _count: { select: { messageLogs: true } } } })
    if (!tpl) return apiError('Template não encontrado', 404)
    return NextResponse.json(tpl)
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const allowed = ['name', 'slug', 'channel', 'subject', 'body', 'event', 'active']
    const data: any = {}
    for (const k of allowed) {
      if (k in body) {
        if (k === 'slug') data[k] = String(body[k]).toLowerCase().replace(/[^a-z0-9_]/g, '_')
        else if (k === 'active') data[k] = Boolean(body[k])
        else data[k] = body[k]
      }
    }
    const tpl = await prisma.messageTemplate.update({ where: { id: params.id }, data })
    return NextResponse.json(tpl)
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    await prisma.messageTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) { return apiError(e.message, 500) }
}
