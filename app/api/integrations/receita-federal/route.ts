// =============================================================================
// API: Verificação na Receita Federal (CPF/CNPJ)
// -----------------------------------------------------------------------------
// PONTO DE INTEGRAÇÃO FUTURA
// -----------------------------------------------------------------------------
// Este endpoint está preparado para receber a integração real com a API da
// Receita Federal (ex: BrasilAPI, Receitaws, SerproDataValid, etc).
//
// Como integrar de verdade no futuro:
//   1. Cadastre a chave do serviço em /settings (campo `receitaApiKey`).
//   2. Substitua o bloco MOCK por uma chamada fetch real, por exemplo:
//        const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`)
//        const data = await r.json()
//   3. Mapeie os campos retornados para o formato `ReceitaFederalData`.
//
// Atualmente retornamos dados simulados para fins de desenvolvimento.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, sanitizeDocument, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const customerId = body?.customerId as string | undefined
    const docRaw = body?.document as string | undefined

    let document = sanitizeDocument(docRaw ?? '')
    let customer = null
    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } })
      if (!customer) return apiError('Cliente não encontrado', 404)
      document = customer.document
    }
    if (!document) return apiError('Documento obrigatório')

    // -------------------------------------------------------------------------
    // [MOCK] Substituir por chamada real à API da Receita Federal
    // -------------------------------------------------------------------------
    const isCnpj = document.length === 14
    const mockData = {
      document,
      status: 'ATIVA',
      name: customer?.name ?? (isCnpj ? 'EMPRESA EXEMPLO LTDA' : 'JOÃO DA SILVA'),
      fantasy: isCnpj ? 'EMPRESA EXEMPLO' : undefined,
      openingDate: '2010-05-15',
      legalNature: isCnpj ? '206-2 - Sociedade Empresária Limitada' : undefined,
      mainActivity: isCnpj ? '61.10-8-03 - Serviços de comunicação multimídia - SCM' : undefined,
      address: {
        street: 'Rua Exemplo',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01001-000',
      },
      phone: '(11) 99999-9999',
      email: 'contato@exemplo.com.br',
      capital: '50000.00',
      raw: { mocked: true, info: 'Substitua por integração real conforme comentários em /api/integrations/receita-federal/route.ts' },
    }
    // -------------------------------------------------------------------------

    if (customer) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          receitaStatus: mockData.status,
          receitaCheckedAt: new Date(),
          receitaData: mockData as any,
        },
      })
    }

    return NextResponse.json({ ok: true, data: mockData, mocked: true })
  } catch (error: any) {
    console.error('[RECEITA_POST]', error)
    return apiError('Erro ao consultar Receita Federal', 500)
  }
}
