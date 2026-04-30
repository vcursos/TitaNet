// =============================================================================
// POST /api/gateways/pix - Gera código PIX para uma fatura
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'
import { generatePixCode, generatePixQrSvg } from '@/lib/pix-utils'

export const dynamic = 'force-dynamic'

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

    // Buscar configurações do provedor
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    if (!settings?.billingPixKey) {
      return apiError('Chave PIX não configurada. Vá em Configurações > Cobrança.', 400)
    }

    const amount = Number(invoice.totalAmount)
    const txid = invoice.number.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25)

    // Gerar payload PIX
    const pixCode = generatePixCode({
      pixKey: settings.billingPixKey,
      merchantName: settings.companyName || 'PROVEDOR',
      merchantCity: settings.companyCity || 'BRASIL',
      amount,
      txid,
    })

    // Gerar URL do QR code
    const pixQrUrl = generatePixQrSvg(pixCode)

    // Salvar PaymentLink
    const link = await prisma.paymentLink.create({
      data: {
        invoiceId,
        type: 'pix',
        pixCode,
        pixQrBase64: pixQrUrl,
        amount,
        status: 'pending',
        gateway: 'pix_manual',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    })

    // Atualizar pixCode na fatura
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pixCode },
    })

    return NextResponse.json(jsonSafe({
      ...link,
      customerName: invoice.customer.name,
      invoiceNumber: invoice.number,
    }))
  } catch (err: any) {
    console.error('[PIX Generate]', err)
    return apiError(err.message || 'Erro ao gerar PIX', 500)
  }
}
