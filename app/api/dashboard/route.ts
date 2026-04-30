// =============================================================================
// API de Dashboard - estatísticas agregadas e métricas avançadas
// =============================================================================
// Esta rota fornece todos os dados consumidos pelo dashboard.
// MODULAR: cada bloco pode ser desativado/expandido sem quebrar o restante.
// Para adicionar novos widgets, basta acrescentar campos ao retorno do GET.
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // 6 meses atrás para gráfico de crescimento
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      overdueCustomers,
      suspendedCustomers,
      totalPlans,
      totalContracts,
      onlineCustomers,
      revenueAggregate,
      planDistribution,
      recentCustomers,
      // Novos: métricas avançadas
      newCustomersThisMonth,
      newCustomersLastMonth,
      pendingContracts,
      signedContracts,
      lowSignalCustomers,
      customersWithoutPlan,
      growthCustomers,
      recentContracts,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.customer.count({ where: { status: 'inactive' } }),
      prisma.customer.count({ where: { status: 'overdue' } }),
      prisma.customer.count({ where: { status: 'suspended' } }),
      prisma.plan.count(),
      prisma.contract.count(),
      prisma.customer.count({ where: { isOnline: true } }),
      prisma.customer.aggregate({
        where: { status: 'active' },
        _sum: { monthlyPrice: true },
      }),
      prisma.customer.groupBy({
        by: ['planId'],
        _count: { _all: true },
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
      prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.customer.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.contract.count({ where: { status: { in: ['draft', 'sent'] } } }),
      prisma.contract.count({ where: { status: 'signed' } }),
      prisma.customer.findMany({
        where: { signalDbm: { lt: -25 } },
        take: 5,
        select: { id: true, name: true, signalDbm: true, equipment: true },
        orderBy: { signalDbm: 'asc' },
      }),
      prisma.customer.count({ where: { planId: null } }),
      prisma.customer.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.contract.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
    ])

    // Distribuição de planos com nomes e porcentagens
    const planIds = planDistribution.map((p: any) => p.planId).filter(Boolean) as string[]
    const plans = planIds.length
      ? await prisma.plan.findMany({ where: { id: { in: planIds } } })
      : []
    const planMap = new Map(plans.map((p: any) => [p.id, p.name]))
    const planChart = planDistribution.map((p: any) => ({
      name: p.planId ? (planMap.get(p.planId) ?? 'Plano removido') : 'Sem plano',
      value: p._count._all,
      percent: totalCustomers > 0 ? Math.round((p._count._all / totalCustomers) * 100) : 0,
    })).sort((a, b) => b.value - a.value)

    const monthlyRevenue = Number(revenueAggregate._sum.monthlyPrice ?? 0)

    // Crescimento percentual
    const growthRate = newCustomersLastMonth > 0
      ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100)
      : (newCustomersThisMonth > 0 ? 100 : 0)

    // Gráfico de crescimento por mês (últimos 6 meses)
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const growthByMonth: Record<string, number> = {}
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const key = `${monthLabels[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`
      growthByMonth[key] = 0
    }
    for (const c of growthCustomers) {
      const d = new Date(c.createdAt)
      const key = `${monthLabels[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`
      if (key in growthByMonth) growthByMonth[key]++
    }
    const growthChart = Object.entries(growthByMonth).map(([name, value]) => ({ name, value }))

    // Taxa de online/offline em %
    const onlinePercent = totalCustomers > 0 ? Math.round((onlineCustomers / totalCustomers) * 100) : 0

    // Receita anual estimada
    const annualRevenue = monthlyRevenue * 12

    return NextResponse.json(jsonSafe({
      // Stats principais
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      overdueCustomers,
      suspendedCustomers,
      totalPlans,
      totalContracts,
      onlineCustomers,
      offlineCustomers: Math.max(0, totalCustomers - onlineCustomers),
      onlinePercent,
      monthlyRevenue,
      annualRevenue,
      planChart,
      recentCustomers,
      // Novas métricas
      newCustomersThisMonth,
      newCustomersLastMonth,
      growthRate,
      growthChart,
      pendingContracts,
      signedContracts,
      lowSignalCustomers,
      customersWithoutPlan,
      recentContracts,
    }))
  } catch (error: any) {
    console.error('[DASHBOARD_GET]', error)
    return apiError('Erro ao carregar dashboard', 500)
  }
}
