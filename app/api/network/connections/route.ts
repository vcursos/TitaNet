// =============================================================================
// API Conexões de Rede - listagem de conexões ativas
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const serverId = searchParams.get('serverId')?.trim()
    const status = searchParams.get('status')?.trim()
    const search = searchParams.get('search')?.trim()
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

    const where: any = {}
    if (serverId) where.serverId = serverId
    if (status && status !== 'all') where.status = status
    if (search) {
      where.OR = [
        { pppoeUser: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const connections = await prisma.connectionLog.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, plan: { select: { name: true } } } },
        server: { select: { id: true, name: true, type: true } },
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    })

    // Converter BigInt para string para serialização JSON
    const serialized = connections.map(c => ({
      ...c,
      rxBytes: c.rxBytes?.toString() || '0',
      txBytes: c.txBytes?.toString() || '0',
    }))

    return NextResponse.json(serialized)
  } catch (e: any) { return apiError(e.message, 500) }
}
