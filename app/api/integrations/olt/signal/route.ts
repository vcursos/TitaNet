// =============================================================================
// API: Verificar Sinal da ONU via OLT
// -----------------------------------------------------------------------------
// PONTO DE INTEGRAÇÃO FUTURA
// -----------------------------------------------------------------------------
// Este endpoint deve ser conectado à API da OLT (ex: Huawei MA5800,
// Fiberhome AN5516, ZTE C300, etc) para obter dados reais de sinal das ONUs.
//
// Estratégias comuns de integração:
//   - SNMP (usar biblioteca `net-snmp`)
//   - Telnet/SSH com parser (`ssh2` + parser de output)
//   - REST/SOAP fornecido pelo fabricante
//   - Software intermediário (UNMS, Smart OLT, OLTPilot)
//
// O resultado deve preencher: signalDbm, txPower, rxPower, status, uptime
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
    // [MOCK] Substituir por consulta real à OLT
    // -------------------------------------------------------------------------
    const signalDbm = -1 * (18 + Math.random() * 14) // -18 a -32 dBm
    const status =
      signalDbm > -25 ? 'ok' : signalDbm > -28 ? 'warning' : 'critical'
    const data = {
      customerId,
      signalDbm: Number(signalDbm.toFixed(2)),
      rxPower: Number(signalDbm.toFixed(2)),
      txPower: Number((2 + Math.random() * 1).toFixed(2)),
      temperature: Number((40 + Math.random() * 20).toFixed(1)),
      status,
      uptime: '12d 4h 33m',
      checkedAt: new Date().toISOString(),
    }
    // -------------------------------------------------------------------------

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        signalDbm: data.signalDbm,
        signalCheckedAt: new Date(),
        isOnline: status !== 'critical',
        lastSeen: new Date(),
      },
    })

    return NextResponse.json({ ok: true, data, mocked: true })
  } catch (error: any) {
    console.error('[OLT_SIGNAL_POST]', error)
    return apiError('Erro ao consultar OLT', 500)
  }
}
