import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const INCLUDE = {
  customer: { select: { id: true, name: true, document: true, phone: true } },
  technician: { select: { id: true, name: true, phone: true } },
  city: { select: { id: true, name: true, state: true } },
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  const item = await prisma.serviceOrder.findUnique({ where: { id: params.id }, include: INCLUDE })
  if (!item) return apiError('Não encontrada', 404)
  return NextResponse.json(jsonSafe(item))
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const b = await req.json()
    const data: any = {}
    const stringFields = ['title', 'description', 'type', 'priority', 'address', 'resolution',
      'customerId', 'technicianId', 'cityId']
    for (const f of stringFields) if (f in b) data[f] = b[f] || null

    // Status com automações
    if ('status' in b) {
      data.status = b.status
      if (b.status === 'in_progress' && !b.startedAt) data.startedAt = new Date()
      if (b.status === 'completed' && !b.completedAt) data.completedAt = new Date()
      if (b.status === 'cancelled' && !b.cancelledAt) data.cancelledAt = new Date()
    }
    for (const d of ['scheduledFor', 'startedAt', 'completedAt', 'cancelledAt']) {
      if (d in b) data[d] = b[d] ? new Date(b[d]) : null
    }

    const updated = await prisma.serviceOrder.update({
      where: { id: params.id }, data, include: INCLUDE,
    })
    return NextResponse.json(jsonSafe(updated))
  } catch (err: any) {
    console.error('[OS_UPDATE]', err)
    if (err.code === 'P2025') return apiError('Não encontrada', 404)
    return apiError('Erro ao atualizar', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    await prisma.serviceOrder.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.code === 'P2025') return apiError('Não encontrada', 404)
    return apiError('Erro ao excluir', 500)
  }
}
