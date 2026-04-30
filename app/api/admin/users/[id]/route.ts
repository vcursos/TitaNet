import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const SAFE_FIELDS = {
  id: true, name: true, email: true, role: true, phone: true, active: true,
  image: true, createdAt: true, updatedAt: true,
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  const u = await prisma.user.findUnique({ where: { id: params.id }, select: SAFE_FIELDS })
  if (!u) return apiError('Não encontrado', 404)
  return NextResponse.json(jsonSafe(u))
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const data: any = {}
    if ('name' in body) data.name = body.name?.trim() || null
    if ('phone' in body) data.phone = body.phone || null
    if ('role' in body) data.role = body.role
    if ('active' in body) data.active = Boolean(body.active)
    if ('email' in body && body.email) data.email = body.email.toLowerCase().trim()
    if (body.password) {
      if (body.password.length < 8) return apiError('Senha deve ter no mínimo 8 caracteres')
      data.password = await bcrypt.hash(body.password, 12)
    }
    const u = await prisma.user.update({ where: { id: params.id }, data, select: SAFE_FIELDS })
    return NextResponse.json(jsonSafe(u))
  } catch (err: any) {
    console.error('[USERS_UPDATE]', err)
    if (err.code === 'P2002') return apiError('Email já em uso', 409)
    if (err.code === 'P2025') return apiError('Não encontrado', 404)
    return apiError('Erro ao atualizar', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  // Proteção: não permitir auto-exclusão
  if (auth.session?.user && (auth.session.user as any).id === params.id) {
    return apiError('Você não pode excluir o próprio usuário', 400)
  }
  try {
    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.code === 'P2025') return apiError('Não encontrado', 404)
    return apiError('Erro ao excluir', 500)
  }
}
