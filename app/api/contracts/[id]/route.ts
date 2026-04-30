import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { customer: { include: { plan: true } }, plan: true },
    })
    if (!contract) return apiError('Contrato não encontrado', 404)
    return NextResponse.json(jsonSafe(contract))
  } catch (error: any) {
    console.error('[CONTRACT_GET]', error)
    return apiError('Erro ao buscar contrato', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const data: any = {}
    const fields = ['status', 'content', 'pdfUrl', 'signatureProvider', 'signatureRequestId', 'signedDocumentUrl']
    for (const f of fields) if (f in body) data[f] = body[f]
    if ('monthlyPrice' in body) data.monthlyPrice = Number(body.monthlyPrice)
    if ('startDate' in body) data.startDate = body.startDate ? new Date(body.startDate) : null
    if ('endDate' in body) data.endDate = body.endDate ? new Date(body.endDate) : null
    if ('signedAt' in body) data.signedAt = body.signedAt ? new Date(body.signedAt) : null

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data,
      include: { customer: true, plan: true },
    })
    return NextResponse.json(jsonSafe(contract))
  } catch (error: any) {
    console.error('[CONTRACT_PATCH]', error)
    return apiError('Erro ao atualizar contrato', 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    await prisma.contract.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[CONTRACT_DELETE]', error)
    return apiError('Erro ao remover contrato', 500)
  }
}
