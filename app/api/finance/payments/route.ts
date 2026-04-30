// =============================================================================
// API de Pagamentos - listagem e registro
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const INCLUDE = {
  customer: { select: { id: true, name: true, document: true } },
  invoice: { select: { id: true, number: true, referenceMonth: true, totalAmount: true } },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')?.trim()
    const invoiceId = searchParams.get('invoiceId')?.trim()
    const search = searchParams.get('search')?.trim()
    const where: any = {}
    if (customerId) where.customerId = customerId
    if (invoiceId) where.invoiceId = invoiceId
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }
    const payments = await prisma.payment.findMany({
      where, include: INCLUDE, orderBy: { paymentDate: 'desc' }, take: 300,
    })
    return NextResponse.json(jsonSafe(payments))
  } catch (err: any) {
    console.error('[PAYMENTS_LIST]', err)
    return apiError('Erro ao listar pagamentos', 500)
  }
}

// Registrar pagamento (baixa)
export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const b = await req.json()
    if (!b.customerId) return apiError('Cliente obrigatório')
    if (!b.amount || Number(b.amount) <= 0) return apiError('Valor inválido')

    const amount = Number(b.amount)
    const userId = (auth.session?.user as any)?.id ?? null

    // Criar pagamento
    const payment = await prisma.payment.create({
      data: {
        invoiceId: b.invoiceId || null,
        customerId: b.customerId,
        amount,
        paymentMethod: b.paymentMethod || 'other',
        paymentDate: b.paymentDate ? new Date(b.paymentDate) : new Date(),
        reference: b.reference || null,
        notes: b.notes || null,
        createdBy: userId,
      },
      include: INCLUDE,
    })

    // Se tem fatura vinculada, atualizar status da fatura
    if (b.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: b.invoiceId } })
      if (invoice) {
        // Somar todos os pagamentos da fatura
        const allPayments = await prisma.payment.aggregate({
          where: { invoiceId: b.invoiceId },
          _sum: { amount: true },
        })
        const totalPaid = Number(allPayments._sum.amount ?? 0)
        const totalDue = Number(invoice.totalAmount)

        let newStatus = invoice.status
        if (totalPaid >= totalDue) {
          newStatus = 'paid'
        } else if (totalPaid > 0) {
          newStatus = 'partially_paid'
        }

        await prisma.invoice.update({
          where: { id: b.invoiceId },
          data: {
            status: newStatus,
            paidAmount: totalPaid,
            paidAt: newStatus === 'paid' ? new Date() : null,
            paymentMethod: b.paymentMethod || null,
          },
        })
      }
    }

    return NextResponse.json(jsonSafe(payment), { status: 201 })
  } catch (err: any) {
    console.error('[PAYMENT_CREATE]', err)
    return apiError(err?.message || 'Erro ao registrar pagamento', 500)
  }
}
