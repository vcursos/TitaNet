// =============================================================================
// API de Clientes
// GET  /api/customers     -> lista (filtros: status, search)
// POST /api/customers     -> cria novo cliente
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, sanitizeDocument, detectDocumentType, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.trim()

    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { document: { contains: sanitizeDocument(search) } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(jsonSafe(customers))
  } catch (error: any) {
    console.error('[CUSTOMERS_GET]', error)
    return apiError('Erro ao listar clientes', 500)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const document = sanitizeDocument(body?.document ?? '')

    if (!body?.name || !document) {
      return apiError('Nome e CPF/CNPJ são obrigatórios')
    }
    if (document.length !== 11 && document.length !== 14) {
      return apiError('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
    }

    const exists = await prisma.customer.findUnique({ where: { document } })
    if (exists) return apiError('Já existe um cliente com este documento', 409)

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        document,
        documentType: detectDocumentType(document),
        email: body.email || null,
        phone: body.phone || null,
        zipCode: body.zipCode || null,
        street: body.street || null,
        number: body.number || null,
        complement: body.complement || null,
        neighborhood: body.neighborhood || null,
        city: body.city || null,
        state: body.state || null,
        planId: body.planId || null,
        monthlyPrice: body.monthlyPrice ? Number(body.monthlyPrice) : null,
        status: body.status || 'active',
        network: body.network || null,
        serverHost: body.serverHost || null,
        equipment: body.equipment || null,
        equipmentMac: body.equipmentMac || null,
        pppoeUser: body.pppoeUser || null,
        ipAddress: body.ipAddress || null,
        notes: body.notes || null,
      },
      include: { plan: true },
    })

    return NextResponse.json(jsonSafe(customer), { status: 201 })
  } catch (error: any) {
    console.error('[CUSTOMERS_POST]', error)
    return apiError('Erro ao criar cliente', 500)
  }
}
