// =============================================================================
// GET/POST /api/gateways/notification-rules - Regras de notificação automática
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const rules = await prisma.notificationRule.findMany({
      include: { template: { select: { id: true, name: true, channel: true } } },
      orderBy: [{ event: 'asc' }, { daysOffset: 'asc' }],
    })
    return NextResponse.json(jsonSafe(rules))
  } catch (err: any) {
    return apiError(err.message, 500)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { name, event, channel, templateId, daysOffset, subject, body: bodyText, active } = body

    if (!name || !event) {
      return apiError('Nome e evento são obrigatórios', 400)
    }

    const rule = await prisma.notificationRule.create({
      data: {
        name,
        event,
        channel: channel || 'email',
        templateId: templateId || null,
        daysOffset: daysOffset ? parseInt(daysOffset) : 0,
        subject: subject || null,
        body: bodyText || null,
        active: active !== false,
      },
      include: { template: { select: { id: true, name: true, channel: true } } },
    })

    return NextResponse.json(jsonSafe(rule), { status: 201 })
  } catch (err: any) {
    return apiError(err.message, 500)
  }
}
