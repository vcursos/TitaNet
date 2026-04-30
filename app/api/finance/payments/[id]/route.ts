// =============================================================================
// API de Pagamento individual - GET / DELETE
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const p = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true } },
      },
    })
    if (!p) return apiError('Pagamento não encontrado', 404)
    return NextResponse.json(jsonSafe(p))
  } catch (err: any) {
    return apiError('Erro ao buscar pagamento', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const payment = await prisma.payment.findUnique({ where: { id: params.id } })
    if (!payment) return apiError('Pagamento não encontrado', 404)

    await prisma.payment.delete({ where: { id: params.id } })

    // Recalcular status da fatura associada
    if (payment.invoiceId) {
      const agg = await prisma.payment.aggregate({
        where: { invoiceId: payment.invoiceId },
        _sum: { amount: true },
      })
      const totalPaid = Number(agg._sum.amount ?? 0)
      const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } })
      if (invoice) {
        const totalDue = Number(invoice.totalAmount)
        let newStatus = 'pending'
        if (totalPaid >= totalDue) newStatus = 'paid'
        else if (totalPaid > 0) newStatus = 'partially_paid'

        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: newStatus,
            paidAmount: totalPaid > 0 ? totalPaid : null,
            paidAt: newStatus === 'paid' ? new Date() : null,
          },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PAYMENT_DELETE]', err)
    return apiError('Erro ao excluir pagamento', 500)
  }
}
