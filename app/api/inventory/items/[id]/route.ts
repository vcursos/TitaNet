import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
  customer: { select: { id: true, name: true } },
  movements: {
    orderBy: { createdAt: 'desc' as const },
    take: 20,
    include: { customer: { select: { id: true, name: true } } },
  },
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id: params.id }, include: INCLUDE })
    if (!item) return apiError('Item não encontrado', 404)
    return NextResponse.json(jsonSafe(item))
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const allowed = ['name', 'description', 'brand', 'model', 'serialNumber', 'categoryId', 'minStock', 'unitCost', 'unitPrice', 'location', 'status', 'customerId', 'notes']
    const data: any = {}
    for (const k of allowed) {
      if (k in body) data[k] = body[k] === '' ? null : body[k]
    }
    if ('minStock' in data && data.minStock !== null) data.minStock = Number(data.minStock)
    if ('unitCost' in data && data.unitCost !== null) data.unitCost = Number(data.unitCost)
    if ('unitPrice' in data && data.unitPrice !== null) data.unitPrice = Number(data.unitPrice)
    const item = await prisma.inventoryItem.update({ where: { id: params.id }, data })
    return NextResponse.json(jsonSafe(item))
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    await prisma.inventoryItem.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) { return apiError(e.message, 500) }
}
