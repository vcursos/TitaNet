import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { getOneHandler, updateHandler, deleteHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'state', 'ibgeCode', 'active', 'notes'],
  include: { _count: { select: { customers: true, pops: true, condominiums: true } } },
  searchFields: [],
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return getOneHandler(prisma.serviceCity, params.id, opts)
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return updateHandler(prisma.serviceCity, params.id, req, opts)
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return deleteHandler(prisma.serviceCity, params.id)
}
