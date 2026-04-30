import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const data: any = {}
    if ('name' in body) data.name = body.name
    if ('description' in body) data.description = body.description || null
    if ('downloadMbps' in body) data.downloadMbps = Number(body.downloadMbps)
    if ('uploadMbps' in body) data.uploadMbps = Number(body.uploadMbps)
    if ('price' in body) data.price = Number(body.price)
    if ('active' in body) data.active = !!body.active

    const plan = await prisma.plan.update({ where: { id: params.id }, data })
    return NextResponse.json(jsonSafe(plan))
  } catch (error: any) {
    console.error('[PLAN_PATCH]', error)
    return apiError('Erro ao atualizar plano', 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    await prisma.plan.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[PLAN_DELETE]', error)
    return apiError('Erro ao remover plano (talvez possua clientes vinculados)', 500)
  }
}
