// =============================================================================
// Top Planos - dashboard
// =============================================================================
// Mostra os planos mais populares com barras de progresso.
// =============================================================================
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'

interface TopPlansProps {
  data: any
  isLoading: boolean
}

export function TopPlans({ data, isLoading }: TopPlansProps) {
  const planChart = (data?.planChart ?? []) as { name: string; value: number; percent: number }[]
  const max = Math.max(1, ...planChart.map((p) => p.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-4 text-primary" /> Top Planos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-md bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : planChart.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhum plano com clientes ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {planChart.slice(0, 6).map((p, i) => (
              <div key={p.name + i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate pr-2">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {p.value} {p.value === 1 ? 'cliente' : 'clientes'} · {p.percent}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-700"
                    style={{ width: `${(p.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
