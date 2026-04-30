// =============================================================================
// API: Verificar status do cliente no MikroTik
// -----------------------------------------------------------------------------
// PONTO DE INTEGRAÇÃO FUTURA
// -----------------------------------------------------------------------------
// Conecte-se ao MikroTik (RouterOS) usando uma das opções:
//   - API nativa do RouterOS (porta 8728/8729) com biblioteca `node-routeros`
//   - REST API (RouterOS v7+)
//   - SSH com parser
//
// Use as credenciais armazenadas em Settings: mikrotikApiUrl, mikrotikApiUser,
// mikrotikApiPassword. Identifique o cliente pelo `pppoeUser` ou `ipAddress`.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const { customerId } = await req.json()
    if (!customerId) return apiError('customerId é obrigatório')

    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) return apiError('Cliente não encontrado', 404)

    // -------------------------------------------------------------------------
    // [MOCK] Substituir por chamada real ao MikroTik
    // -------------------------------------------------------------------------
    const isOnline = Math.random() > 0.2
    const data = {
      customerId,
      isOnline,
      uptime: isOnline ? '3d 14h 22m' : null,
      ipAddress: customer.ipAddress ?? '10.10.0.123',
      bytesIn: isOnline ? Math.floor(Math.random() * 5_000_000_000) : 0,
      bytesOut: isOnline ? Math.floor(Math.random() * 1_000_000_000) : 0,
      sessionId: isOnline ? `*${Math.floor(Math.random() * 999999)}` : null,
      checkedAt: new Date().toISOString(),
    }
    // -------------------------------------------------------------------------

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        isOnline: data.isOnline,
        lastSeen: data.isOnline ? new Date() : customer.lastSeen,
      },
    })

    return NextResponse.json({ ok: true, data, mocked: true })
  } catch (error: any) {
    console.error('[MIKROTIK_STATUS_POST]', error)
    return apiError('Erro ao consultar MikroTik', 500)
  }
}
