// =============================================================================
// API Monitor de Rede - dados consolidados para dashboard de rede
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const [
      totalCustomers,
      onlineCustomers,
      offlineCustomers,
      blockedCustomers,
      servers,
      recentConnections,
      lowSignal,
    ] = await Promise.all([
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.customer.count({ where: { status: 'active', isOnline: true } }),
      prisma.customer.count({ where: { status: 'active', isOnline: { not: true } } }),
      prisma.customer.count({ where: { status: 'suspended' } }),
      prisma.server.findMany({
        where: { active: true, type: { in: ['mikrotik', 'olt', 'radius'] } },
        select: {
          id: true, name: true, type: true, host: true, active: true,
          lastSyncAt: true, lastSyncError: true, onlineClients: true,
          pop: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.connectionLog.findMany({
        take: 20,
        orderBy: { recordedAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          server: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.customer.findMany({
        where: { status: 'active', signalDbm: { lt: -25 } },
        select: { id: true, name: true, signalDbm: true, equipment: true, ipAddress: true },
        orderBy: { signalDbm: 'asc' },
        take: 10,
      }),
    ])

    const onlinePercent = totalCustomers > 0 ? Math.round((onlineCustomers / totalCustomers) * 100) : 0

    // Calcular distribuição por servidor
    const serverDistribution = servers.map(s => ({
      ...s,
      lastSyncAt: s.lastSyncAt?.toISOString() || null,
    }))

    return NextResponse.json(jsonSafe({
      totalActive: totalCustomers,
      online: onlineCustomers,
      offline: offlineCustomers,
      blocked: blockedCustomers,
      onlinePercent,
      servers: serverDistribution,
      recentConnections,
      lowSignal,
    }))
  } catch (e: any) { return apiError(e.message, 500) }
}
