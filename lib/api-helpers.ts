// =============================================================================
// Helpers para rotas de API
// =============================================================================
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    }
  }
  return { session, response: null }
}

export function sanitizeDocument(doc: string): string {
  return (doc ?? '').replace(/\D/g, '')
}

export function detectDocumentType(doc: string): 'CPF' | 'CNPJ' {
  const clean = sanitizeDocument(doc)
  return clean.length === 14 ? 'CNPJ' : 'CPF'
}

// Converte Decimal/BigInt para número/string seguros para JSON
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (typeof val === 'bigint') return val.toString()
      if (val && typeof val === 'object' && val.constructor?.name === 'Decimal') {
        return Number(val.toString())
      }
      return val
    })
  )
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
