// =============================================================================
// Card de Receita Detalhada - dashboard
// =============================================================================
// Mostra receita mensal, anual estimada e novos clientes do mês.
// =============================================================================
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { formatBRL } from '@/lib/format'

interface RevenueCardProps {
  data: any
  isLoading: boolean
}

export function RevenueCard({ data, isLoading }: RevenueCardProps) {
  const monthly = Number(data?.monthlyRevenue ?? 0)
  const annual = Number(data?.annualRevenue ?? 0)
  const ticket = (data?.activeCustomers ?? 0) > 0
    ? monthly / (data?.activeCustomers ?? 1)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="size-4 text-primary" /> Faturamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32 rounded-md bg-muted/50 animate-pulse" />
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Mensal recorrente
              </div>
              <div className="font-display text-3xl font-bold tracking-tight mt-1">
                {formatBRL(monthly)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-md border bg-muted/20">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  <Calendar className="size-3" /> Anual estimado
                </div>
                <div className="font-display text-base font-bold mt-1">{formatBRL(annual)}</div>
              </div>
              <div className="p-3 rounded-md border bg-muted/20">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  <TrendingUp className="size-3" /> Ticket médio
                </div>
                <div className="font-display text-base font-bold mt-1">{formatBRL(ticket)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
