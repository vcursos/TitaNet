// =============================================================================
// PATCH/DELETE /api/gateways/payment-links/[id]
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
    const allowed = ['status', 'externalId', 'gateway']
    const data: any = {}
    for (const k of allowed) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (data.status === 'paid') data.paidAt = new Date()

    const updated = await prisma.paymentLink.update({
      where: { id: params.id },
      data,
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
    await prisma.paymentLink.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return apiError(err.message, 500)
  }
}
