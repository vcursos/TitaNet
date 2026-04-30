// =============================================================================
// Geração do contrato em HTML (imprimível como PDF pelo browser)
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { renderContractHtml } from '@/lib/contract-template'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { customer: true, plan: true },
  })
  if (!contract) return new NextResponse('Contrato não encontrado', { status: 404 })

  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  const html = renderContractHtml(contract as any, settings as any)
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
