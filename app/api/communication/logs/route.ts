// =============================================================================
// API de Logs de Mensagens - listagem
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const channel = searchParams.get('channel')?.trim()
    const status = searchParams.get('status')?.trim()
    const search = searchParams.get('search')?.trim()
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

    const where: any = {}
    if (channel && channel !== 'all') where.channel = channel
    if (status && status !== 'all') where.status = status
    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const logs = await prisma.messageLog.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json(logs)
  } catch (e: any) { return apiError(e.message, 500) }
}
