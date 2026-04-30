// =============================================================================
// API de Busca Rápida de Clientes
// =============================================================================
// Endpoint dedicado à busca rápida (autocomplete) usada no dashboard.
// Aceita ?q=termo e retorna até 8 resultados.
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError, sanitizeDocument } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') ?? '').trim()
    if (!q) return NextResponse.json({ results: [] })

    const sanitized = sanitizeDocument(q)

    const results = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { document: { contains: sanitized } },
          { phone: { contains: sanitized } },
        ],
      },
      take: 8,
      include: { plan: { select: { name: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(jsonSafe({ results }))
  } catch (error: any) {
    console.error('[CUSTOMERS_SEARCH]', error)
    return apiError('Erro na busca', 500)
  }
}
