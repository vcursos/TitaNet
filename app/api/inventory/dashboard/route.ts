// =============================================================================
// API Dashboard de Estoque - estatísticas consolidadas
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const [totalItems, totalCategories, items, recentMovements] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.inventoryCategory.count(),
      prisma.inventoryItem.findMany({
        select: { id: true, name: true, sku: true, quantity: true, minStock: true, status: true, unitCost: true, category: { select: { name: true, color: true } } },
      }),
      prisma.inventoryMovement.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          item: { select: { id: true, name: true, sku: true } },
          customer: { select: { id: true, name: true } },
        },
      }),
    ])

    const available = items.filter(i => i.status === 'available').length
    const installed = items.filter(i => i.status === 'installed').length
    const defective = items.filter(i => i.status === 'defective').length
    const lowStock = items.filter(i => i.quantity <= i.minStock && i.status === 'available')
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)
    const totalValue = items.reduce((sum, i) => sum + (Number(i.unitCost || 0) * i.quantity), 0)

    // Distribuição por categoria
    const byCategory: Record<string, { name: string; color: string; count: number }> = {}
    for (const item of items) {
      const catName = item.category?.name || 'Sem categoria'
      const catColor = item.category?.color || '#6b7280'
      if (!byCategory[catName]) byCategory[catName] = { name: catName, color: catColor, count: 0 }
      byCategory[catName].count += item.quantity
    }

    return NextResponse.json(jsonSafe({
      totalItems,
      totalCategories,
      totalUnits,
      totalValue,
      available,
      installed,
      defective,
      lowStock,
      byCategory: Object.values(byCategory).sort((a, b) => b.count - a.count),
      recentMovements,
    }))
  } catch (e: any) { return apiError(e.message, 500) }
}
