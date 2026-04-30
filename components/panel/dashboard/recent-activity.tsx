// =============================================================================
// Feed de Atividades Recentes - dashboard
// =============================================================================
// Combina clientes recentes e contratos recentes em um feed unificado.
// =============================================================================
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, UserPlus, FileSignature } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RecentActivityProps {
  data: any
  isLoading: boolean
}

export function RecentActivity({ data, isLoading }: RecentActivityProps) {
  const customers = (data?.recentCustomers ?? []).map((c: any) => ({
    type: 'customer' as const,
    id: c.id,
    title: c.name,
    subtitle: c.plan?.name ?? 'Sem plano',
    date: c.createdAt,
    href: `/customers/${c.id}`,
  }))

  const contracts = (data?.recentContracts ?? []).map((c: any) => ({
    type: 'contract' as const,
    id: c.id,
    title: `Contrato ${c.contractNumber}`,
    subtitle: c.customer?.name ?? '—',
    date: c.createdAt,
    href: `/contracts/${c.id}`,
  }))

  const items = [...customers, ...contracts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-md bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhuma atividade ainda.
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.type === 'customer' ? UserPlus : FileSignature
              const tone = item.type === 'customer'
                ? 'text-blue-600 bg-blue-100 dark:bg-blue-950'
                : 'text-purple-600 bg-purple-100 dark:bg-purple-950'
              const tag = item.type === 'customer' ? 'Cadastro' : 'Contrato'

              let timeAgo = ''
              try {
                timeAgo = formatDistanceToNow(new Date(item.date), {
                  addSuffix: true,
                  locale: ptBR,
                })
              } catch {}

              return (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/40 transition"
                  >
                    <div className={`size-8 rounded-md grid place-items-center shrink-0 ${tone}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                          {tag}
                        </span>
                        <span className="text-[10px] text-muted-foreground">· {timeAgo}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{item.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
