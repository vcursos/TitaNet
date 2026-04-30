// =============================================================================
// API Itens de Estoque - listagem e criação
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
  customer: { select: { id: true, name: true } },
  _count: { select: { movements: true } },
}

// Gerar próximo SKU: EST-NNNNN
async function nextSku(): Promise<string> {
  const last = await prisma.inventoryItem.findFirst({ orderBy: { sku: 'desc' }, select: { sku: true } })
  const num = last ? parseInt(last.sku.replace('EST-', ''), 10) + 1 : 1
  return `EST-${String(num).padStart(5, '0')}`
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const category = searchParams.get('category')?.trim()
    const status = searchParams.get('status')?.trim()
    const lowStock = searchParams.get('lowStock')
    const where: any = {}
    if (category && category !== 'all') where.categoryId = category
    if (status && status !== 'all') where.status = status
    if (lowStock === 'true') {
      where.quantity = { lte: prisma.inventoryItem.fields.minStock }
      // Prisma doesn't support field comparison directly, we'll filter in-memory
      delete where.quantity
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    let items = await prisma.inventoryItem.findMany({ where, include: INCLUDE, orderBy: { name: 'asc' } })
    // Filtro low stock em memória
    if (lowStock === 'true') {
      items = items.filter(i => i.quantity <= i.minStock)
    }
    return NextResponse.json(jsonSafe(items))
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    if (!body.name) return apiError('Nome é obrigatório', 400)
    const sku = body.sku || await nextSku()
    const item = await prisma.inventoryItem.create({
      data: {
        sku,
        name: body.name,
        description: body.description || null,
        brand: body.brand || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        categoryId: body.categoryId || null,
        quantity: Number(body.quantity) || 0,
        minStock: Number(body.minStock) || 5,
        unitCost: body.unitCost ? Number(body.unitCost) : null,
        unitPrice: body.unitPrice ? Number(body.unitPrice) : null,
        location: body.location || null,
        status: body.status || 'available',
        notes: body.notes || null,
      },
      include: INCLUDE,
    })

    // Registrar movimento de entrada inicial se quantity > 0
    if (item.quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          itemId: item.id,
          type: 'in',
          quantity: item.quantity,
          previousQty: 0,
          newQty: item.quantity,
          reason: 'Estoque inicial',
          createdBy: auth.session.user.id,
        },
      })
    }

    return NextResponse.json(jsonSafe(item), { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return apiError('SKU ou Serial já cadastrado', 400)
    return apiError(e.message, 500)
  }
}
