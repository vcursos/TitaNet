import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { getOneHandler, updateHandler, deleteHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'code', 'description', 'address', 'latitude', 'longitude', 'cityId', 'active'],
  transforms: {
    latitude: (v: any) => v == null || v === '' ? null : Number(v),
    longitude: (v: any) => v == null || v === '' ? null : Number(v),
    active: (v: any) => v === false ? false : Boolean(v),
  },
  include: { city: true, _count: { select: { servers: true, customers: true } } },
  searchFields: [],
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return getOneHandler(prisma.networkPOP, params.id, opts)
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return updateHandler(prisma.networkPOP, params.id, req, opts)
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return deleteHandler(prisma.networkPOP, params.id)
}
