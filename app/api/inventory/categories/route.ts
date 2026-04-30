// =============================================================================
// API Categorias de Estoque - listagem e criação
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const cats = await prisma.inventoryCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } },
    })
    return NextResponse.json(cats)
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    if (!body.name) return apiError('Nome é obrigatório', 400)
    const cat = await prisma.inventoryCategory.create({
      data: { name: body.name, color: body.color || '#6366f1', icon: body.icon || 'Package' },
    })
    return NextResponse.json(cat, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return apiError('Categoria já existe', 400)
    return apiError(e.message, 500)
  }
}
