// =============================================================================
// API de Faturas - listagem e criação avulsa
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const INCLUDE = {
  customer: { select: { id: true, name: true, document: true } },
  _count: { select: { payments: true } },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')?.trim()
    const month = searchParams.get('month')?.trim()
    const search = searchParams.get('search')?.trim()
    const customerId = searchParams.get('customerId')?.trim()
    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (month) where.referenceMonth = month
    if (customerId) where.customerId = customerId
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { document: { contains: search.replace(/\D/g, '') } } },
      ]
    }
    const invoices = await prisma.invoice.findMany({
      where, include: INCLUDE, orderBy: { dueDate: 'desc' }, take: 300,
    })
    return NextResponse.json(jsonSafe(invoices))
  } catch (err: any) {
    console.error('[INVOICES_LIST]', err)
    return apiError('Erro ao listar faturas', 500)
  }
}

// Criação avulsa de fatura
export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const b = await req.json()
    if (!b.customerId) return apiError('Cliente obrigatório')
    if (!b.amount || Number(b.amount) <= 0) return apiError('Valor inválido')
    if (!b.dueDate) return apiError('Vencimento obrigatório')
    if (!b.referenceMonth) return apiError('Mês de referência obrigatório')

    const number = await generateInvoiceNumber()
    const amount = Number(b.amount)
    const discount = Number(b.discount ?? 0)
    const totalAmount = amount - discount

    const invoice = await prisma.invoice.create({
      data: {
        number,
        customerId: b.customerId,
        referenceMonth: b.referenceMonth,
        amount,
        discount,
        totalAmount: totalAmount > 0 ? totalAmount : 0,
        dueDate: new Date(b.dueDate),
        notes: b.notes || null,
      },
      include: INCLUDE,
    })
    return NextResponse.json(jsonSafe(invoice), { status: 201 })
  } catch (err: any) {
    console.error('[INVOICE_CREATE]', err)
    return apiError(err?.message || 'Erro ao criar fatura', 500)
  }
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.invoice.count({
    where: { number: { startsWith: `FAT-${year}-` } },
  })
  return `FAT-${year}-${String(count + 1).padStart(5, '0')}`
}
