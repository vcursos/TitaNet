// API de Ordens de Serviço
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const INCLUDE = {
  customer: { select: { id: true, name: true, document: true } },
  technician: { select: { id: true, name: true } },
  city: { select: { id: true, name: true, state: true } },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')?.trim()
    const search = searchParams.get('search')?.trim()
    const technicianId = searchParams.get('technicianId') || undefined
    const where: any = {}
    if (status) where.status = status
    if (technicianId) where.technicianId = technicianId
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ]
    }
    const orders = await prisma.serviceOrder.findMany({
      where, include: INCLUDE, orderBy: { createdAt: 'desc' }, take: 200,
    })
    return NextResponse.json(jsonSafe(orders))
  } catch (err: any) {
    console.error('[OS_LIST]', err)
    return apiError('Erro ao listar OS', 500)
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const b = await req.json()
    if (!b.title) return apiError('Título obrigatório')

    // Gera número sequencial OS-YYYY-NNNN
    const year = new Date().getFullYear()
    const count = await prisma.serviceOrder.count({
      where: { number: { startsWith: `OS-${year}-` } },
    })
    const number = `OS-${year}-${String(count + 1).padStart(4, '0')}`

    const created = await prisma.serviceOrder.create({
      data: {
        number,
        title: b.title,
        description: b.description || null,
        type: b.type || 'installation',
        priority: b.priority || 'normal',
        status: b.status || 'open',
        customerId: b.customerId || null,
        technicianId: b.technicianId || null,
        cityId: b.cityId || null,
        address: b.address || null,
        scheduledFor: b.scheduledFor ? new Date(b.scheduledFor) : null,
      },
      include: INCLUDE,
    })
    return NextResponse.json(jsonSafe(created), { status: 201 })
  } catch (err: any) {
    console.error('[OS_CREATE]', err)
    return apiError(err?.message || 'Erro ao criar OS', 500)
  }
}
