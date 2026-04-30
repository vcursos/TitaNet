// =============================================================================
// API de Contratos
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const contracts = await prisma.contract.findMany({
      include: { customer: true, plan: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(jsonSafe(contracts))
  } catch (error: any) {
    console.error('[CONTRACTS_GET]', error)
    return apiError('Erro ao listar contratos', 500)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    if (!body?.customerId) return apiError('customerId é obrigatório')

    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
      include: { plan: true },
    })
    if (!customer) return apiError('Cliente não encontrado', 404)

    const planId = body.planId ?? customer.planId
    const plan = planId
      ? await prisma.plan.findUnique({ where: { id: planId } })
      : null

    const monthlyPrice = body.monthlyPrice
      ? Number(body.monthlyPrice)
      : Number(customer.monthlyPrice ?? plan?.price ?? 0)

    const contractNumber = `TN-${Date.now().toString().slice(-8)}`

    const contract = await prisma.contract.create({
      data: {
        customerId: customer.id,
        planId: plan?.id ?? null,
        contractNumber,
        status: 'draft',
        monthlyPrice,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
        content: body.content ?? null,
      },
      include: { customer: true, plan: true },
    })

    return NextResponse.json(jsonSafe(contract), { status: 201 })
  } catch (error: any) {
    console.error('[CONTRACTS_POST]', error)
    return apiError('Erro ao criar contrato', 500)
  }
}
