// =============================================================================
// Dashboard Financeiro - visão geral de faturamento, recebimentos e inadimplência
// =============================================================================
'use client'

import useSWR from 'swr'
import { Loader2, DollarSign, TrendingUp, AlertTriangle, Clock, Receipt,
  ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { formatBRL } from '@/lib/format'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function FinanceDashboardView() {
  const { data, isLoading } = useSWR('/api/finance/dashboard', fetcher, { refreshInterval: 30000 })

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )

  const d = data || {}
  const revenueGrowth = d.lastMonthRevenue > 0
    ? ((d.thisMonthRevenue - d.lastMonthRevenue) / d.lastMonthRevenue * 100).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          Dashboard Financeiro
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do faturamento, recebimentos e inadimplência — {d.currentMonth ?? ''}
        </p>
      </div>

      {/* ----- Cards de resumo ----- */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Receipt} label="Faturas geradas" value={String(d.thisMonthInvoices ?? 0)}
          sub={`Total: ${d.totalInvoices ?? 0}`} color="text-blue-600 bg-blue-50 dark:bg-blue-950" />
        <StatCard icon={CreditCard} label="Recebido (mês)" value={formatBRL(d.thisMonthRevenue ?? 0)}
          sub={revenueGrowth !== null ? `${Number(revenueGrowth) >= 0 ? '+' : ''}${revenueGrowth}% vs mês anterior` : 'Primeiro mês'}
          subIcon={revenueGrowth !== null && Number(revenueGrowth) >= 0 ? ArrowUpRight : ArrowDownRight}
          subColor={revenueGrowth !== null && Number(revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-500'}
          color="text-green-600 bg-green-50 dark:bg-green-950" />
        <StatCard icon={Clock} label="A receber" value={formatBRL(d.pendingRevenueTotal ?? 0)}
          sub={`${d.pendingCount ?? 0} pendente(s)`} color="text-amber-600 bg-amber-50 dark:bg-amber-950" />
        <StatCard icon={AlertTriangle} label="Inadimplência" value={formatBRL(d.overdueTotalAmount ?? 0)}
          sub={`${d.overdueCount ?? 0} vencida(s)`} color="text-red-600 bg-red-50 dark:bg-red-950" />
      </div>

      {/* ----- Status breakdown ----- */}
      <div className="grid sm:grid-cols-5 gap-3">
        <MiniStat label="Pendentes" value={d.pendingCount ?? 0} color="bg-amber-500" />
        <MiniStat label="Pagas" value={d.paidCount ?? 0} color="bg-green-500" />
        <MiniStat label="Vencidas" value={d.overdueCount ?? 0} color="bg-red-500" />
        <MiniStat label="Canceladas" value={d.cancelledCount ?? 0} color="bg-gray-400" />
        <MiniStat label="Total geral" value={d.totalInvoices ?? 0} color="bg-blue-500" />
      </div>

      {/* ----- Listas ----- */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Faturas vencidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Faturas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!d.overdueInvoices || d.overdueInvoices.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma fatura vencida 🎉</p>
            ) : (
              <div className="space-y-2">
                {d.overdueInvoices.slice(0, 8).map((inv: any) => (
                  <Link key={inv.id} href="/finance/invoices" className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm">
                    <div>
                      <span className="font-mono text-xs font-medium">{inv.number}</span>
                      <span className="ml-2 text-muted-foreground">{inv.customer?.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">{formatBRL(Number(inv.totalAmount))}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Venc. {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos recentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Pagamentos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!d.recentPayments || d.recentPayments.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado.</p>
            ) : (
              <div className="space-y-2">
                {d.recentPayments.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm">
                    <div>
                      <span className="font-medium">{p.customer?.name}</span>
                      {p.invoice?.number && (
                        <span className="ml-2 text-xs text-muted-foreground">{p.invoice.number}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">+{formatBRL(Number(p.amount))}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---- Componentes auxiliares ----

function StatCard({ icon: Icon, label, value, sub, subIcon: SubIcon, subColor, color }: {
  icon: any; label: string; value: string; sub: string; color: string;
  subIcon?: any; subColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className={`text-xs flex items-center gap-1 ${subColor || 'text-muted-foreground'}`}>
              {SubIcon && <SubIcon className="h-3 w-3" />}
              {sub}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <div className={`h-1.5 rounded-full ${color} mb-2`} />
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
