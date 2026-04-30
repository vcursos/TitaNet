// =============================================================================
// POST /api/gateways/boleto - Gera dados de boleto para uma fatura [MOCK]
// Em produção: integrar com Asaas, PagHiper, Inter, Sicredi, etc.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function generateBarcodeDigits(): string {
  // [MOCK] Gera linha digitável simulada
  const seg = () => Math.floor(10000000000 + Math.random() * 89999999999).toString()
  return `${seg()} ${seg()} ${seg()} ${Math.floor(1 + Math.random() * 9)} ${seg()}${seg().substring(0, 3)}`
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const { invoiceId } = await req.json()
    if (!invoiceId) return apiError('invoiceId obrigatório', 400)

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    })
    if (!invoice) return apiError('Fatura não encontrada', 404)

    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    const amount = Number(invoice.totalAmount)

    // [MOCK] Gerar dados de boleto simulado
    const barcode = generateBarcodeDigits()
    const boletoUrl = `#boleto-mock-${invoice.number}` // Em produção: URL real do boleto

    const link = await prisma.paymentLink.create({
      data: {
        invoiceId,
        type: 'boleto',
        boletoBarcode: barcode,
        boletoUrl,
        amount,
        status: 'pending',
        gateway: 'boleto_mock',
        expiresAt: invoice.dueDate,
      },
    })

    // Atualizar barcode na fatura
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { barcode },
    })

    return NextResponse.json(jsonSafe({
      ...link,
      customerName: invoice.customer.name,
      invoiceNumber: invoice.number,
      bankName: settings?.billingBankName || 'Banco Mock',
    }))
  } catch (err: any) {
    console.error('[Boleto Generate]', err)
    return apiError(err.message || 'Erro ao gerar boleto', 500)
  }
}
