// API de Cidades de Atendimento
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { listHandler, createHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'state', 'ibgeCode', 'active', 'notes'],
  searchFields: ['name', 'state'],
  transforms: { active: (v: any) => v === false ? false : Boolean(v) },
  include: { _count: { select: { customers: true, pops: true, condominiums: true } } },
  orderBy: { name: 'asc' as const },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return listHandler(prisma.serviceCity, req, opts)
}
export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return createHandler(prisma.serviceCity, req, opts)
}
