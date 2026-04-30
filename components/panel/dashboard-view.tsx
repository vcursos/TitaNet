// =============================================================================
// Dashboard - Visão principal
// =============================================================================
// Esta view é puramente um "layout" que orquestra widgets independentes.
// Cada widget vive em components/panel/dashboard/* e pode ser editado/movido
// sem afetar os outros. Para adicionar um novo widget:
//   1) Crie o componente em components/panel/dashboard/<seu-widget>.tsx
//   2) Importe e posicione abaixo dentro de uma das grids
//   3) Se precisar de novos dados, expanda /api/dashboard/route.ts
// =============================================================================
'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Users, UserCheck, UserX, AlertTriangle, Wifi, WifiOff,
  Package, FileSignature, ArrowRight, DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Widgets modulares
import { WelcomeBanner } from '@/components/panel/dashboard/welcome-banner'
import { QuickSearch } from '@/components/panel/dashboard/quick-search'
import { QuickActions } from '@/components/panel/dashboard/quick-actions'
import { AlertsPanel } from '@/components/panel/dashboard/alerts-panel'
import { NetworkHealth } from '@/components/panel/dashboard/network-health'
import { TopPlans } from '@/components/panel/dashboard/top-plans'
import { RecentActivity } from '@/components/panel/dashboard/recent-activity'
import { GrowthChart } from '@/components/panel/dashboard/growth-chart'
import { RevenueCard } from '@/components/panel/dashboard/revenue-card'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function CountUp({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const dur = 700
    const startVal = 0
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(startVal + (value - startVal) * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [value])
  return <>{prefix}{n.toLocaleString('pt-BR')}{suffix}</>
}

export function DashboardView() {
  const { data: session } = useSession() || {}
  const { data, isLoading } = useSWR('/api/dashboard', fetcher, { refreshInterval: 30000 })

  const stats = [
    { label: 'Total de Clientes', value: data?.totalCustomers ?? 0, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950' },
    { label: 'Clientes Ativos', value: data?.activeCustomers ?? 0, icon: UserCheck, color: 'text-green-600 bg-green-100 dark:bg-green-950' },
    { label: 'Inadimplentes', value: data?.overdueCustomers ?? 0, icon: AlertTriangle, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950' },
    { label: 'Inativos', value: data?.inactiveCustomers ?? 0, icon: UserX, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900' },
  ]

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: Boas-vindas + Busca rápida */}
      <WelcomeBanner userName={session?.user?.name ?? session?.user?.email} />

      <QuickSearch />

      {/* SEÇÃO 2: Ações Rápidas */}
      <QuickActions />

      {/* SEÇÃO 3: Stats principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className={`size-10 rounded-md grid place-items-center mb-3 ${s.color}`}>
                  <s.icon className="size-5" />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{s.label}</div>
                <div className="font-display text-3xl font-bold tracking-tight mt-1">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : <CountUp value={s.value} />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* SEÇÃO 4: Métricas secundárias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-emerald-100 text-emerald-700 grid place-items-center dark:bg-emerald-950"><DollarSign className="size-5" /></div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wider truncate">Receita Mensal</div>
                <div className="font-display text-lg font-bold truncate">
                  R$ {isLoading ? '...' : Number(data?.monthlyRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-green-100 text-green-700 grid place-items-center dark:bg-green-950"><Wifi className="size-5" /></div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Online</div>
                <div className="font-display text-xl font-bold"><CountUp value={data?.onlineCustomers ?? 0} /></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-red-100 text-red-700 grid place-items-center dark:bg-red-950"><WifiOff className="size-5" /></div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Offline</div>
                <div className="font-display text-xl font-bold"><CountUp value={data?.offlineCustomers ?? 0} /></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-purple-100 text-purple-700 grid place-items-center dark:bg-purple-950"><FileSignature className="size-5" /></div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Contratos</div>
                <div className="font-display text-xl font-bold"><CountUp value={data?.totalContracts ?? 0} /></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 5: Pendências + Saúde da Rede + Faturamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AlertsPanel data={data} isLoading={isLoading} />
        <NetworkHealth data={data} isLoading={isLoading} />
        <RevenueCard data={data} isLoading={isLoading} />
      </div>

      {/* SEÇÃO 6: Crescimento + Top Planos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GrowthChart data={data} isLoading={isLoading} />
        <TopPlans data={data} isLoading={isLoading} />
      </div>

      {/* SEÇÃO 7: Atividades Recentes + Clientes Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity data={data} isLoading={isLoading} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users className="size-4 text-primary" /> Clientes Recentes</CardTitle>
            <Link href="/customers"><Button variant="outline" size="sm" className="gap-1">Ver todos <ArrowRight className="size-3" /></Button></Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (data?.recentCustomers ?? []).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhum cliente cadastrado ainda. <Link href="/customers" className="text-primary hover:underline">Cadastrar primeiro</Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(data?.recentCustomers ?? []).map((c: any) => (
                  <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-md -mx-2 transition">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center font-medium">
                        {c.name?.[0]?.toUpperCase() ?? 'C'}
                      </div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.plan?.name ?? 'Sem plano'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{c.status === 'active' ? '🟢 Ativo' : c.status === 'overdue' ? '🟡 Inadimplente' : c.status === 'suspended' ? '🔴 Suspenso' : '⚫ Inativo'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
