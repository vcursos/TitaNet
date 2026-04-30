import { prisma } from '@/lib/db'
import { requireAuth, sanitizeDocument } from '@/lib/api-helpers'
import { getOneHandler, updateHandler, deleteHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'document', 'email', 'phone', 'team', 'active', 'baseSalary', 'hourlyRate', 'perOrderRate', 'notes'],
  transforms: {
    document: (v: any) => v ? sanitizeDocument(v) : null,
    active: (v: any) => v === false ? false : Boolean(v),
    baseSalary: (v: any) => v == null || v === '' ? null : Number(v),
    hourlyRate: (v: any) => v == null || v === '' ? null : Number(v),
    perOrderRate: (v: any) => v == null || v === '' ? null : Number(v),
  },
  include: { _count: { select: { serviceOrders: true } } },
  searchFields: [],
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return getOneHandler(prisma.technician, params.id, opts)
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return updateHandler(prisma.technician, params.id, req, opts)
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return deleteHandler(prisma.technician, params.id)
}
