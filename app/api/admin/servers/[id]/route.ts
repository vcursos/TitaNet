import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { getOneHandler, updateHandler, deleteHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'type', 'host', 'port', 'username', 'password', 'apiToken', 'notes', 'active', 'popId'],
  transforms: {
    port: (v: any) => v == null || v === '' ? null : Number(v),
    active: (v: any) => v === false ? false : Boolean(v),
  },
  include: { pop: { include: { city: true } } },
  searchFields: [],
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return getOneHandler(prisma.server, params.id, opts)
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return updateHandler(prisma.server, params.id, req, opts)
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return deleteHandler(prisma.server, params.id)
}
