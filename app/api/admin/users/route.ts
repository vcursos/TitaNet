// API de Usuários do sistema (admins, operadores, técnicos, vendedores)
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const SAFE_FIELDS = {
  id: true, name: true, email: true, role: true, phone: true, active: true,
  image: true, createdAt: true, updatedAt: true,
}

export async function GET(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    const users = await prisma.user.findMany({
      where,
      select: SAFE_FIELDS,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(jsonSafe(users))
  } catch (err: any) {
    console.error('[USERS_LIST]', err)
    return apiError('Erro ao listar usuários', 500)
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const { name, email, password, role, phone, active } = body

    if (!email || !password) return apiError('Email e senha são obrigatórios')
    if (password.length < 8) return apiError('Senha deve ter no mínimo 8 caracteres')

    const normalized = email.toLowerCase().trim()
    const exists = await prisma.user.findUnique({ where: { email: normalized } })
    if (exists) return apiError('Email já cadastrado', 409)

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalized,
        password: hash,
        role: role || 'operator',
        phone: phone || null,
        active: active === false ? false : true,
      },
      select: SAFE_FIELDS,
    })
    return NextResponse.json(jsonSafe(user), { status: 201 })
  } catch (err: any) {
    console.error('[USERS_CREATE]', err)
    return apiError('Erro ao criar usuário', 500)
  }
}
