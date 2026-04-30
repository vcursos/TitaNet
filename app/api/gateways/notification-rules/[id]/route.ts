// =============================================================================
// PATCH/DELETE /api/gateways/notification-rules/[id]
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const allowed = ['name', 'event', 'channel', 'templateId', 'daysOffset', 'subject', 'body', 'active']
    const data: any = {}
    for (const k of allowed) {
      if (body[k] !== undefined) {
        if (k === 'daysOffset') data[k] = parseInt(body[k])
        else if (k === 'active') data[k] = Boolean(body[k])
        else data[k] = body[k] || null
      }
    }

    const updated = await prisma.notificationRule.update({
      where: { id: params.id },
      data,
      include: { template: { select: { id: true, name: true, channel: true } } },
    })
    return NextResponse.json(jsonSafe(updated))
  } catch (err: any) {
    return apiError(err.message, 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    await prisma.notificationRule.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return apiError(err.message, 500)
  }
}
