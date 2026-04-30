// API de POPs (Pontos de Presença)
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { listHandler, createHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'code', 'description', 'address', 'latitude', 'longitude', 'cityId', 'active'],
  searchFields: ['name', 'code'],
  transforms: {
    latitude: (v: any) => v == null || v === '' ? null : Number(v),
    longitude: (v: any) => v == null || v === '' ? null : Number(v),
    active: (v: any) => v === false ? false : Boolean(v),
  },
  include: { city: true, _count: { select: { servers: true, customers: true } } },
  orderBy: { name: 'asc' as const },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return listHandler(prisma.networkPOP, req, opts)
}
export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return createHandler(prisma.networkPOP, req, opts)
}
