// =============================================================================
// GET /api/gateways/payment-links - Lista links de pagamento
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.invoice = {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    }

    const links = await prisma.paymentLink.findMany({
      where,
      include: {
        invoice: {
          include: { customer: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Stats
    const [total, pending, paid, expired] = await Promise.all([
      prisma.paymentLink.count(),
      prisma.paymentLink.count({ where: { status: 'pending' } }),
      prisma.paymentLink.count({ where: { status: 'paid' } }),
      prisma.paymentLink.count({ where: { status: 'expired' } }),
    ])

    return NextResponse.json(jsonSafe({ links, stats: { total, pending, paid, expired } }))
  } catch (err: any) {
    console.error('[PaymentLinks List]', err)
    return apiError(err.message, 500)
  }
}
