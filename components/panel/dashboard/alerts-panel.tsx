// =============================================================================
// Painel de Alertas e Pendências - dashboard
// =============================================================================
// Concentra os principais itens que exigem atenção do operador.
// Para adicionar um novo tipo de alerta, basta acrescentar um bloco no JSX.
// =============================================================================
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileSignature, SignalLow, UserX, ArrowRight } from 'lucide-react'

interface AlertsPanelProps {
  data: any
  isLoading: boolean
}

export function AlertsPanel({ data, isLoading }: AlertsPanelProps) {
  const alerts = [
    {
      key: 'overdue',
      label: 'Inadimplentes',
      count: data?.overdueCustomers ?? 0,
      icon: AlertTriangle,
      tone: 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300',
      href: '/customers?status=overdue',
      description: 'Clientes com pagamento em atraso',
    },
    {
      key: 'pendingContracts',
      label: 'Contratos pendentes',
      count: data?.pendingContracts ?? 0,
      icon: FileSignature,
      tone: 'text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300',
      href: '/contracts',
      description: 'Aguardando assinatura ou rascunhos',
    },
    {
      key: 'lowSignal',
      label: 'Sinal fraco',
      count: (data?.lowSignalCustomers ?? []).length,
      icon: SignalLow,
      tone: 'text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300',
      href: '/customers',
      description: 'ONUs com sinal abaixo de -25 dBm',
    },
    {
      key: 'noPlan',
      label: 'Sem plano',
      count: data?.customersWithoutPlan ?? 0,
      icon: UserX,
      tone: 'text-gray-700 bg-gray-100 dark:bg-gray-900 dark:text-gray-300',
      href: '/customers',
      description: 'Clientes sem plano vinculado',
    },
  ]

  const totalPending = alerts.reduce((acc, a) => acc + a.count, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          Pendências
          {totalPending > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">
              {totalPending}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-md bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <Link
                key={a.key}
                href={a.href}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border hover:bg-muted/40 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-9 rounded-md grid place-items-center shrink-0 ${a.tone}`}>
                    <a.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-display font-bold tabular-nums">{a.count}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </div>
              </Link>
            ))}

            {/* Lista de clientes com sinal fraco (preview) */}
            {(data?.lowSignalCustomers ?? []).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Clientes com sinal crítico
                </div>
                <div className="space-y-1.5">
                  {data.lowSignalCustomers.slice(0, 3).map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/customers/${c.id}`}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-muted/40"
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="font-mono text-red-600 dark:text-red-400 shrink-0 ml-2">
                        {c.signalDbm} dBm
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
