// =============================================================================
// CRUD Helpers - reduz código repetitivo nas APIs administrativas
// =============================================================================
// As APIs de admin (cidades, pops, servidores, condomínios, técnicos, OS,
// usuários) seguem todas o mesmo padrão GET/POST e GET/PATCH/DELETE.
// =============================================================================
import { NextResponse } from 'next/server'
import { jsonSafe, apiError } from './api-helpers'

type DelegateLike = {
  findMany: (args?: any) => Promise<any>
  findUnique: (args: any) => Promise<any>
  create: (args: any) => Promise<any>
  update: (args: any) => Promise<any>
  delete: (args: any) => Promise<any>
}

interface CrudOptions {
  // Campos que serão aceitos no body (lista branca)
  fields: string[]
  // Conversores opcionais por campo (ex: number -> Number(v))
  transforms?: Record<string, (v: any) => any>
  // Inclui relações no findMany / findUnique
  include?: any
  // Ordenacao padrão
  orderBy?: any
  // Termo de busca (campo string a procurar)
  searchFields?: string[]
}

export function pickAndTransform(
  body: any,
  fields: string[],
  transforms?: Record<string, (v: any) => any>,
) {
  const out: any = {}
  for (const k of fields) {
    if (k in body) {
      const raw = body[k]
      const v = raw === '' ? null : raw
      out[k] = transforms?.[k] ? transforms[k](v) : v
    }
  }
  return out
}

export async function listHandler(
  delegate: DelegateLike,
  req: Request,
  opts: CrudOptions,
) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()

    const where: any = {}
    if (search && opts.searchFields?.length) {
      where.OR = opts.searchFields.map((f) => ({
        [f]: { contains: search, mode: 'insensitive' },
      }))
    }

    const items = await delegate.findMany({
      where,
      include: opts.include,
      orderBy: opts.orderBy ?? { createdAt: 'desc' },
    })
    return NextResponse.json(jsonSafe(items))
  } catch (err: any) {
    console.error('[CRUD_LIST]', err)
    return apiError('Erro ao listar', 500)
  }
}

export async function createHandler(
  delegate: DelegateLike,
  req: Request,
  opts: CrudOptions,
) {
  try {
    const body = await req.json()
    const data = pickAndTransform(body, opts.fields, opts.transforms)
    const created = await delegate.create({ data, include: opts.include })
    return NextResponse.json(jsonSafe(created), { status: 201 })
  } catch (err: any) {
    console.error('[CRUD_CREATE]', err)
    if (err.code === 'P2002') return apiError('Registro duplicado', 409)
    return apiError(err?.message ?? 'Erro ao criar', 500)
  }
}

export async function getOneHandler(
  delegate: DelegateLike,
  id: string,
  opts: CrudOptions,
) {
  try {
    const item = await delegate.findUnique({ where: { id }, include: opts.include })
    if (!item) return apiError('Não encontrado', 404)
    return NextResponse.json(jsonSafe(item))
  } catch (err: any) {
    console.error('[CRUD_GET]', err)
    return apiError('Erro', 500)
  }
}

export async function updateHandler(
  delegate: DelegateLike,
  id: string,
  req: Request,
  opts: CrudOptions,
) {
  try {
    const body = await req.json()
    const data = pickAndTransform(body, opts.fields, opts.transforms)
    const updated = await delegate.update({ where: { id }, data, include: opts.include })
    return NextResponse.json(jsonSafe(updated))
  } catch (err: any) {
    console.error('[CRUD_UPDATE]', err)
    if (err.code === 'P2025') return apiError('Não encontrado', 404)
    return apiError(err?.message ?? 'Erro ao atualizar', 500)
  }
}

export async function deleteHandler(
  delegate: DelegateLike,
  id: string,
) {
  try {
    await delegate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[CRUD_DELETE]', err)
    if (err.code === 'P2025') return apiError('Não encontrado', 404)
    return apiError('Erro ao excluir', 500)
  }
}
