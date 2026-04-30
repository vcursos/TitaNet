import { prisma } from '@/lib/db'
import { requireAuth, sanitizeDocument } from '@/lib/api-helpers'
import { listHandler, createHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'document', 'email', 'phone', 'team', 'active', 'baseSalary', 'hourlyRate', 'perOrderRate', 'notes'],
  searchFields: ['name', 'email', 'team'],
  transforms: {
    document: (v: any) => v ? sanitizeDocument(v) : null,
    active: (v: any) => v === false ? false : Boolean(v),
    baseSalary: (v: any) => v == null || v === '' ? null : Number(v),
    hourlyRate: (v: any) => v == null || v === '' ? null : Number(v),
    perOrderRate: (v: any) => v == null || v === '' ? null : Number(v),
  },
  include: { _count: { select: { serviceOrders: true } } },
  orderBy: { name: 'asc' as const },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return listHandler(prisma.technician, req, opts)
}
export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return createHandler(prisma.technician, req, opts)
}
