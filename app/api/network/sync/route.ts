// =============================================================================
// API Sync de Rede - simula sincronização com MikroTik/OLT
// [MOCK] Todas as funções de conexão são simuladas.
//        Substituir pela lógica real de API RouterOS / SNMP / etc.
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// [MOCK] Simula busca de sessões PPPoE ativas no MikroTik
async function mockMikrotikSync(server: any) {
  // TODO: Implementar conexão real via routeros-client ou REST API
  // const api = new RouterOSAPI({ host: server.host, user: server.username, password: server.password })
  // const sessions = await api.connect().then(c => c.write('/ppp/active/print'))
  const customers = await prisma.customer.findMany({
    where: { status: 'active', pppoeUser: { not: null } },
    select: { id: true, pppoeUser: true, ipAddress: true, equipmentMac: true, plan: { select: { name: true, downloadMbps: true, uploadMbps: true } } },
    take: 50,
  })

  const connections = []
  let onlineCount = 0

  for (const c of customers) {
    // Simula 70-85% online
    const isOnline = Math.random() > 0.2
    if (isOnline) onlineCount++

    await prisma.customer.update({
      where: { id: c.id },
      data: {
        isOnline,
        lastSeen: isOnline ? new Date() : undefined,
      },
    })

    if (isOnline) {
      connections.push({
        customerId: c.id,
        serverId: server.id,
        pppoeUser: c.pppoeUser,
        ipAddress: c.ipAddress || `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 100) + 2}`,
        macAddress: c.equipmentMac || null,
        uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        rxRate: `${(Math.random() * (c.plan?.downloadMbps || 100)).toFixed(1)} Mbps`,
        txRate: `${(Math.random() * (c.plan?.uploadMbps || 50)).toFixed(1)} Mbps`,
        rxBytes: BigInt(Math.floor(Math.random() * 1e12)),
        txBytes: BigInt(Math.floor(Math.random() * 5e11)),
        status: 'online',
        source: 'mikrotik',
        profileName: c.plan?.name || null,
        maxDownload: c.plan ? `${c.plan.downloadMbps}M` : null,
        maxUpload: c.plan ? `${c.plan.uploadMbps}M` : null,
      })
    }
  }

  return { connections, onlineCount }
}

// [MOCK] Simula leitura de sinais OLT
async function mockOltSync(server: any) {
  const customers = await prisma.customer.findMany({
    where: { status: 'active', equipment: { not: null } },
    select: { id: true, equipment: true, equipmentMac: true },
    take: 50,
  })

  for (const c of customers) {
    const signal = -(Math.random() * 15 + 15) // -15 a -30 dBm
    await prisma.customer.update({
      where: { id: c.id },
      data: { signalDbm: parseFloat(signal.toFixed(1)), signalCheckedAt: new Date() },
    })
  }

  return { checked: customers.length }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const { serverId } = body

    if (!serverId) return apiError('Informe o servidor', 400)

    const server = await prisma.server.findUnique({ where: { id: serverId } })
    if (!server) return apiError('Servidor não encontrado', 404)
    if (!server.active) return apiError('Servidor inativo', 400)

    let result: any = {}

    try {
      if (server.type === 'mikrotik' || server.type === 'radius') {
        const { connections, onlineCount } = await mockMikrotikSync(server)

        // Limpar conexões antigas deste servidor e inserir novas
        await prisma.connectionLog.deleteMany({ where: { serverId: server.id } })
        if (connections.length > 0) {
          await prisma.connectionLog.createMany({ data: connections })
        }

        // Atualizar status do servidor
        await prisma.server.update({
          where: { id: server.id },
          data: { lastSyncAt: new Date(), lastSyncError: null, onlineClients: onlineCount },
        })

        result = { type: 'mikrotik', onlineCount, totalSessions: connections.length }
      } else if (server.type === 'olt') {
        const { checked } = await mockOltSync(server)

        await prisma.server.update({
          where: { id: server.id },
          data: { lastSyncAt: new Date(), lastSyncError: null },
        })

        result = { type: 'olt', checked }
      } else {
        return apiError('Tipo de servidor não suportado para sync', 400)
      }
    } catch (syncError: any) {
      await prisma.server.update({
        where: { id: server.id },
        data: { lastSyncAt: new Date(), lastSyncError: syncError.message },
      })
      return apiError(`Erro na sincronização: ${syncError.message}`, 500)
    }

    return NextResponse.json({ ok: true, server: server.name, ...result })
  } catch (e: any) { return apiError(e.message, 500) }
}
