// =============================================================================
// API Movimentações de Estoque - listagem e registro
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')?.trim()
    const type = searchParams.get('type')?.trim()
    const search = searchParams.get('search')?.trim()
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

    const where: any = {}
    if (itemId) where.itemId = itemId
    if (type && type !== 'all') where.type = type
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { item: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const moves = await prisma.inventoryMovement.findMany({
      where,
      include: {
        item: { select: { id: true, name: true, sku: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json(jsonSafe(moves))
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const { itemId, type, quantity, reason, customerId, reference } = body
    if (!itemId || !type || !quantity) return apiError('Item, tipo e quantidade são obrigatórios', 400)

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } })
    if (!item) return apiError('Item não encontrado', 404)

    const qty = Number(quantity)
    const isOut = ['out', 'install'].includes(type)
    const effectiveQty = isOut ? -Math.abs(qty) : Math.abs(qty)
    const previousQty = item.quantity
    const newQty = previousQty + effectiveQty

    if (newQty < 0) return apiError(`Estoque insuficiente (atual: ${previousQty})`, 400)

    // Registrar movimento e atualizar saldo atomicamente
    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          itemId,
          type,
          quantity: effectiveQty,
          previousQty,
          newQty,
          reason: reason || null,
          customerId: customerId || null,
          reference: reference || null,
          createdBy: auth.session.user.id,
        },
        include: {
          item: { select: { id: true, name: true, sku: true } },
          customer: { select: { id: true, name: true } },
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: newQty,
          // Se instalação, vincular ao cliente e mudar status
          ...(type === 'install' && customerId ? { customerId, status: 'installed' } : {}),
          // Se devolução, desvincular cliente
          ...(type === 'return' ? { customerId: null, status: 'available' } : {}),
        },
      }),
    ])

    return NextResponse.json(jsonSafe(movement), { status: 201 })
  } catch (e: any) { return apiError(e.message, 500) }
}
