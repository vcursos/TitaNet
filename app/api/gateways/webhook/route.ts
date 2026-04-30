// =============================================================================
// POST /api/gateways/webhook - Webhook para confirmação de pagamento
// Recebe notificações de gateways (Asaas, MercadoPago, PagHiper, etc.)
// Em produção: validar assinatura/token do gateway
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { jsonSafe } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// NÃO requer auth - webhooks são chamados externamente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { externalId, status, paidAmount, paymentMethod, gateway } = body

    // [MOCK] Em produção, validar token/assinatura do gateway aqui
    // Ex: const signature = req.headers.get('x-webhook-signature')
    // Ex: if (!validateSignature(signature, body)) return apiError('Invalid', 401)

    if (!externalId && !body.invoiceNumber) {
      return NextResponse.json({ error: 'externalId ou invoiceNumber obrigatório' }, { status: 400 })
    }

    // Buscar PaymentLink pelo externalId ou pela fatura
    let paymentLink = null
    if (externalId) {
      paymentLink = await prisma.paymentLink.findFirst({
        where: { externalId },
        include: { invoice: { include: { customer: true } } },
      })
    }

    if (!paymentLink && body.invoiceNumber) {
      const invoice = await prisma.invoice.findUnique({
        where: { number: body.invoiceNumber },
      })
      if (invoice) {
        paymentLink = await prisma.paymentLink.findFirst({
          where: { invoiceId: invoice.id, status: 'pending' },
          include: { invoice: { include: { customer: true } } },
        })
      }
    }

    if (!paymentLink) {
      console.warn('[Webhook] PaymentLink não encontrado:', { externalId, invoiceNumber: body.invoiceNumber })
      return NextResponse.json({ received: true, processed: false, reason: 'link_not_found' })
    }

    if (status === 'paid' || status === 'confirmed') {
      const amount = paidAmount ? Number(paidAmount) : Number(paymentLink.amount)

      // Transação atômica: atualizar link + fatura + criar payment
      await prisma.$transaction(async (tx: any) => {
        // 1. Marcar link como pago
        await tx.paymentLink.update({
          where: { id: paymentLink!.id },
          data: { status: 'paid', paidAt: new Date() },
        })

        // 2. Criar registro de Payment
        await tx.payment.create({
          data: {
            invoiceId: paymentLink!.invoiceId,
            customerId: paymentLink!.invoice.customerId,
            amount,
            paymentMethod: paymentMethod || paymentLink!.type,
            paymentDate: new Date(),
            reference: `Webhook ${gateway || paymentLink!.gateway} - ${externalId || ''}`,
            createdBy: 'webhook',
          },
        })

        // 3. Atualizar status da fatura
        const invoiceTotal = Number(paymentLink!.invoice.totalAmount)
        const prevPaid = Number(paymentLink!.invoice.paidAmount || 0)
        const totalPaid = prevPaid + amount
        const newStatus = totalPaid >= invoiceTotal ? 'paid' : 'partially_paid'

        await tx.invoice.update({
          where: { id: paymentLink!.invoiceId },
          data: {
            status: newStatus,
            paidAmount: totalPaid,
            paidAt: newStatus === 'paid' ? new Date() : undefined,
            paymentMethod: paymentMethod || paymentLink!.type,
          },
        })
      })

      console.log(`[Webhook] Pagamento confirmado: Fatura ${paymentLink.invoice.number}, R$ ${paidAmount || paymentLink.amount}`)
      return NextResponse.json({ received: true, processed: true, status: 'paid' })
    }

    if (status === 'expired' || status === 'cancelled') {
      await prisma.paymentLink.update({
        where: { id: paymentLink.id },
        data: { status },
      })
      return NextResponse.json({ received: true, processed: true, status })
    }

    return NextResponse.json({ received: true, processed: false, reason: 'status_not_handled' })
  } catch (err: any) {
    console.error('[Webhook Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
