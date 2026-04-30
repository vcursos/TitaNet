// =============================================================================
// API de Cliente individual
// GET    /api/customers/[id]
// PATCH  /api/customers/[id]
// DELETE /api/customers/[id]
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, sanitizeDocument, detectDocumentType, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { plan: true, contracts: true },
    })
    if (!customer) return apiError('Cliente não encontrado', 404)
    return NextResponse.json(jsonSafe(customer))
  } catch (error: any) {
    console.error('[CUSTOMER_GET]', error)
    return apiError('Erro ao buscar cliente', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const data: any = {}

    const fields = [
      'name', 'email', 'phone', 'zipCode', 'street', 'number', 'complement',
      'neighborhood', 'city', 'state', 'planId', 'status', 'network',
      'serverHost', 'equipment', 'equipmentMac', 'pppoeUser', 'ipAddress', 'notes',
    ]
    for (const f of fields) {
      if (f in body) data[f] = body[f] === '' ? null : body[f]
    }
    if ('document' in body) {
      const document = sanitizeDocument(body.document)
      data.document = document
      data.documentType = detectDocumentType(document)
    }
    if ('monthlyPrice' in body) {
      data.monthlyPrice = body.monthlyPrice ? Number(body.monthlyPrice) : null
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data,
      include: { plan: true },
    })
    return NextResponse.json(jsonSafe(customer))
  } catch (error: any) {
    console.error('[CUSTOMER_PATCH]', error)
    return apiError('Erro ao atualizar cliente', 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    await prisma.customer.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[CUSTOMER_DELETE]', error)
    return apiError('Erro ao remover cliente', 500)
  }
}
