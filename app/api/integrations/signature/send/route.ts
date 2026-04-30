// =============================================================================
// API: Enviar contrato para assinatura digital
// -----------------------------------------------------------------------------
// PONTO DE INTEGRAÇÃO FUTURA
// -----------------------------------------------------------------------------
// Provedores suportados (a serem implementados):
//   - ClickSign  -> https://www.clicksign.com/
//   - DocuSign   -> https://developers.docusign.com/
//   - Autentique -> https://docs.autentique.com.br/
//   - ZapSign    -> https://docs.zapsign.com.br/
//
// Fluxo recomendado:
//   1. Gere o PDF do contrato (já disponível via /contracts/[id]/pdf).
//   2. Envie para o provedor de assinatura usando a API key salva em Settings.
//   3. Salve o `signatureRequestId` retornado.
//   4. Configure webhook para receber a notificação de assinatura concluída
//      e atualize `signedAt` + `signedDocumentUrl`.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const { contractId } = await req.json()
    if (!contractId) return apiError('contractId é obrigatório')

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { customer: true },
    })
    if (!contract) return apiError('Contrato não encontrado', 404)

    // -------------------------------------------------------------------------
    // [MOCK] Substituir por integração real (ex: ClickSign)
    // -------------------------------------------------------------------------
    const fakeRequestId = `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'sent',
        signatureProvider: 'mock',
        signatureRequestId: fakeRequestId,
      },
    })
    // -------------------------------------------------------------------------

    return NextResponse.json({
      ok: true,
      mocked: true,
      signatureRequestId: fakeRequestId,
      message: 'Contrato preparado para envio. Configure o provedor de assinatura em Configurações.',
    })
  } catch (error: any) {
    console.error('[SIGNATURE_SEND]', error)
    return apiError('Erro ao enviar contrato para assinatura', 500)
  }
}
