import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { listHandler, createHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: [
    'name', 'cnpj', 'zipCode', 'street', 'number', 'complement', 'neighborhood',
    'state', 'cityId', 'managerName', 'managerPhone', 'managerEmail', 'unitsCount',
    'notes', 'active',
  ],
  searchFields: ['name', 'managerName', 'cnpj'],
  transforms: {
    unitsCount: (v: any) => v == null || v === '' ? null : Number(v),
    active: (v: any) => v === false ? false : Boolean(v),
  },
  include: { city: true, _count: { select: { customers: true } } },
  orderBy: { name: 'asc' as const },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return listHandler(prisma.condominium, req, opts)
}
export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return createHandler(prisma.condominium, req, opts)
}
