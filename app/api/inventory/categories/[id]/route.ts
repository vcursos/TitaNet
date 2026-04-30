import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const data: any = {}
    if ('name' in body) data.name = body.name
    if ('color' in body) data.color = body.color
    if ('icon' in body) data.icon = body.icon
    if ('active' in body) data.active = Boolean(body.active)
    const cat = await prisma.inventoryCategory.update({ where: { id: params.id }, data })
    return NextResponse.json(cat)
  } catch (e: any) { return apiError(e.message, 500) }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    await prisma.inventoryCategory.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) { return apiError(e.message, 500) }
}
