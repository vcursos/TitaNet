// =============================================================================
// API de Planos
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
      include: { _count: { select: { customers: true } } },
    })
    return NextResponse.json(jsonSafe(plans))
  } catch (error: any) {
    console.error('[PLANS_GET]', error)
    return apiError('Erro ao listar planos', 500)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    if (!body?.name || body?.downloadMbps == null || body?.uploadMbps == null || body?.price == null) {
      return apiError('Nome, velocidades e preço são obrigatórios')
    }
    const plan = await prisma.plan.create({
      data: {
        name: body.name,
        description: body.description || null,
        downloadMbps: Number(body.downloadMbps),
        uploadMbps: Number(body.uploadMbps),
        price: Number(body.price),
        active: body.active !== false,
      },
    })
    return NextResponse.json(jsonSafe(plan), { status: 201 })
  } catch (error: any) {
    console.error('[PLANS_POST]', error)
    return apiError('Erro ao criar plano', 500)
  }
}
