// =============================================================================
// Geração em lote de faturas para um mês de referência
// =============================================================================
// POST { referenceMonth: '2026-05', dueDay?: 10 }
// Gera uma fatura para cada cliente ATIVO com plano que ainda não tem
// fatura para aquele mês.
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const b = await req.json()
    const refMonth = b.referenceMonth
    if (!refMonth || !/^\d{4}-\d{2}$/.test(refMonth)) {
      return apiError('Mês de referência inválido (use YYYY-MM)')
    }

    // Buscar configs de cobrança
    const settings = await prisma.settings.findFirst({ where: { id: 'singleton' } })
    const dueDay = b.dueDay || settings?.billingDueDay || 10

    // Calcular data de vencimento
    const [year, month] = refMonth.split('-').map(Number)
    const dueDate = new Date(year, month - 1, dueDay)
    // Se dia inválido (ex: 31 em fev), ajusta para último dia do mês
    if (dueDate.getMonth() !== month - 1) {
      dueDate.setDate(0) // último dia do mês anterior
    }

    // Clientes ativos com plano e preço
    const customers = await prisma.customer.findMany({
      where: {
        status: 'active',
        planId: { not: null },
        monthlyPrice: { not: null, gt: 0 },
      },
      select: { id: true, monthlyPrice: true },
    })

    // Clientes que já têm fatura nesse mês
    const existing = await prisma.invoice.findMany({
      where: { referenceMonth: refMonth },
      select: { customerId: true },
    })
    const existingSet = new Set(existing.map((e) => e.customerId))

    // Filtrar só os que não têm fatura
    const toGenerate = customers.filter((c) => !existingSet.has(c.id))

    if (toGenerate.length === 0) {
      return NextResponse.json({ generated: 0, message: 'Todas as faturas já foram geradas para este mês.' })
    }

    // Gerar números sequenciais
    const yearStr = new Date().getFullYear()
    const currentCount = await prisma.invoice.count({
      where: { number: { startsWith: `FAT-${yearStr}-` } },
    })

    const invoicesData = toGenerate.map((c, idx) => {
      const amount = Number(c.monthlyPrice)
      return {
        number: `FAT-${yearStr}-${String(currentCount + idx + 1).padStart(5, '0')}`,
        customerId: c.id,
        referenceMonth: refMonth,
        amount,
        discount: 0,
        interest: 0,
        fine: 0,
        totalAmount: amount,
        dueDate,
        status: 'pending',
        notes: settings?.billingNotes || null,
      }
    })

    const result = await prisma.invoice.createMany({ data: invoicesData })

    return NextResponse.json({
      generated: result.count,
      message: `${result.count} fatura(s) gerada(s) para ${refMonth}.`,
    })
  } catch (err: any) {
    console.error('[INVOICES_GENERATE]', err)
    return apiError(err?.message || 'Erro ao gerar faturas', 500)
  }
}
