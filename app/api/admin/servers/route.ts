// API de Servidores (MikroTik, Radius, OLT, etc.)
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-helpers'
import { listHandler, createHandler } from '@/lib/crud-helpers'

export const dynamic = 'force-dynamic'

const opts = {
  fields: ['name', 'type', 'host', 'port', 'username', 'password', 'apiToken', 'notes', 'active', 'popId'],
  searchFields: ['name', 'host', 'type'],
  transforms: {
    port: (v: any) => v == null || v === '' ? null : Number(v),
    active: (v: any) => v === false ? false : Boolean(v),
  },
  include: { pop: { include: { city: true } } },
  orderBy: { name: 'asc' as const },
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return listHandler(prisma.server, req, opts)
}
export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  return createHandler(prisma.server, req, opts)
}
