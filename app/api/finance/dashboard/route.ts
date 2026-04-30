// =============================================================================
// Dashboard Financeiro - estatísticas de faturamento e pagamentos
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

    const [totalInvoices, pendingCount, paidCount, overdueCount, cancelledCount,
     thisMonthInvoices, lastMonthInvoices,
     totalRevenue, thisMonthRevenue, lastMonthRevenue,
     thisMonthPayments, recentPayments, overdueInvoices,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'pending' } }),
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.invoice.count({ where: { status: 'overdue' } }),
      prisma.invoice.count({ where: { status: 'cancelled' } }),
      prisma.invoice.count({ where: { referenceMonth: currentMonth } }),
      prisma.invoice.count({ where: { referenceMonth: lastMonth } }),
      prisma.invoice.aggregate({ _sum: { paidAmount: true }, where: { status: 'paid' } }),
      prisma.invoice.aggregate({ _sum: { paidAmount: true }, where: { status: 'paid', referenceMonth: currentMonth } }),
      prisma.invoice.aggregate({ _sum: { paidAmount: true }, where: { status: 'paid', referenceMonth: lastMonth } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: {
        paymentDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      }}),
      prisma.payment.findMany({
        take: 10,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          invoice: { select: { number: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ['pending', 'overdue'] }, dueDate: { lt: now } },
        take: 10,
        orderBy: { dueDate: 'asc' },
        include: { customer: { select: { id: true, name: true } } },
      }),
    ])

    // Receita pendente total
    const pendingRevenue = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ['pending', 'overdue', 'partially_paid'] } },
    })

    // Inadimplência (faturas vencidas não pagas)
    const overdueTotal = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ['overdue'] } },
    })

    return NextResponse.json(jsonSafe({
      totalInvoices,
      pendingCount,
      paidCount,
      overdueCount,
      cancelledCount,
      thisMonthInvoices,
      lastMonthInvoices,
      currentMonth,
      totalRevenue: Number(totalRevenue._sum.paidAmount ?? 0),
      thisMonthRevenue: Number(thisMonthRevenue._sum.paidAmount ?? 0),
      lastMonthRevenue: Number(lastMonthRevenue._sum.paidAmount ?? 0),
      thisMonthPayments: Number(thisMonthPayments._sum.amount ?? 0),
      pendingRevenueTotal: Number(pendingRevenue._sum.totalAmount ?? 0),
      overdueTotalAmount: Number(overdueTotal._sum.totalAmount ?? 0),
      recentPayments,
      overdueInvoices,
    }))
  } catch (err: any) {
    console.error('[FINANCE_DASHBOARD]', err)
    return apiError('Erro ao carregar dashboard financeiro', 500)
  }
}
