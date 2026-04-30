// =============================================================================
// Gráfico de Crescimento - dashboard
// =============================================================================
// Mostra novos clientes nos últimos 6 meses (line chart).
// =============================================================================
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

interface GrowthChartProps {
  data: any
  isLoading: boolean
}

export function GrowthChart({ data, isLoading }: GrowthChartProps) {
  const chart = (data?.growthChart ?? []) as { name: string; value: number }[]
  const growthRate = data?.growthRate ?? 0
  const thisMonth = data?.newCustomersThisMonth ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Crescimento
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Este mês:</span>
            <span className="font-display text-base font-bold">{thisMonth}</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                growthRate >= 0
                  ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading ? (
          <div className="h-full rounded-md bg-muted/50 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-muted" stroke="currentColor" opacity={0.2} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelStyle={{ fontWeight: 600 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#growthGrad)"
                name="Novos clientes"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
