// =============================================================================
// Saúde da Rede - dashboard
// =============================================================================
// Mostra a proporção de clientes online/offline com indicador visual.
// =============================================================================
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, WifiOff, Activity } from 'lucide-react'

interface NetworkHealthProps {
  data: any
  isLoading: boolean
}

export function NetworkHealth({ data, isLoading }: NetworkHealthProps) {
  const total = data?.totalCustomers ?? 0
  const online = data?.onlineCustomers ?? 0
  const offline = data?.offlineCustomers ?? 0
  const percent = data?.onlinePercent ?? 0

  // Cor da barra baseada no percentual de online
  const barColor = percent >= 80
    ? 'bg-emerald-500'
    : percent >= 50
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Saúde da Rede
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32 rounded-md bg-muted/50 animate-pulse" />
        ) : (
          <div className="space-y-4">
            {/* Círculo com porcentagem */}
            <div className="flex items-center gap-4">
              <div className="relative size-24 shrink-0">
                <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${(percent / 100) * 264} 264`}
                    strokeLinecap="round"
                    className={percent >= 80 ? 'text-emerald-500' : percent >= 50 ? 'text-amber-500' : 'text-red-500'}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="font-display text-xl font-bold tabular-nums">{percent}%</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Online</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="size-4 text-emerald-500 shrink-0" />
                    <span className="text-muted-foreground">Online</span>
                  </div>
                  <span className="font-display font-semibold tabular-nums">{online}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <WifiOff className="size-4 text-red-500 shrink-0" />
                    <span className="text-muted-foreground">Offline</span>
                  </div>
                  <span className="font-display font-semibold tabular-nums">{offline}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="font-display font-semibold tabular-nums text-sm">{total}</span>
                </div>
              </div>
            </div>

            {/* Barra horizontal */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-700`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-[11px] text-muted-foreground">
              {percent >= 80
                ? '✨ Excelente! A maioria dos seus clientes está conectada.'
                : percent >= 50
                  ? '⚠️ Atenção: parte significativa está offline.'
                  : '🚨 Crítico: muitos clientes desconectados. Verifique a infraestrutura.'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
