// =============================================================================
// InventoryDashboardView - painel de estoque com stats e movimentações recentes
// =============================================================================
'use client'

import useSWR from 'swr'
import {
  Package, Boxes, AlertTriangle, CheckCircle2, Wrench, ArrowDown, ArrowUp,
  RotateCcw, ArrowRightLeft, Settings2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const moveTypeMap: Record<string, { label: string; icon: any; cls: string }> = {
  in: { label: 'Entrada', icon: ArrowDown, cls: 'text-green-600' },
  out: { label: 'Saída', icon: ArrowUp, cls: 'text-red-600' },
  install: { label: 'Instalação', icon: Settings2, cls: 'text-blue-600' },
  return: { label: 'Devolução', icon: RotateCcw, cls: 'text-purple-600' },
  transfer: { label: 'Transferência', icon: ArrowRightLeft, cls: 'text-yellow-600' },
  adjustment: { label: 'Ajuste', icon: Wrench, cls: 'text-muted-foreground' },
}

function toBRL(v: any): string {
  const n = Number(v)
  if (isNaN(n)) return 'R$ 0,00'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function InventoryDashboardView() {
  const { data, isLoading } = useSWR('/api/inventory/dashboard', fetcher, { refreshInterval: 60000 })

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do inventário de equipamentos e materiais</p>
        </div>
        <Link href="/inventory/items"><Button>Ver Todos os Itens</Button></Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30"><Package className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{data?.totalItems ?? 0}</p>
              <p className="text-xs text-muted-foreground">Itens cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30"><Boxes className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{data?.totalUnits ?? 0}</p>
              <p className="text-xs text-muted-foreground">Unidades em estoque</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950/30"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold">{data?.lowStock?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Estoque baixo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30"><CheckCircle2 className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold">{toBRL(data?.totalValue)}</p>
              <p className="text-xs text-muted-foreground">Valor total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-xl font-bold text-green-600">{data?.available ?? 0}</p>
          <p className="text-xs text-muted-foreground">Disponíveis</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xl font-bold text-blue-600">{data?.installed ?? 0}</p>
          <p className="text-xs text-muted-foreground">Instalados</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xl font-bold text-destructive">{data?.defective ?? 0}</p>
          <p className="text-xs text-muted-foreground">Defeituosos</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estoque baixo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />Estoque Baixo
            </CardTitle>
            <Link href="/inventory/items?lowStock=true"><Button variant="ghost" size="sm">Ver todos</Button></Link>
          </CardHeader>
          <CardContent>
            {!data?.lowStock?.length ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum item com estoque baixo.</p>
            ) : (
              <div className="space-y-2">
                {data.lowStock.slice(0, 8).map((item: any) => (
                  <Link key={item.id} href={`/inventory/items`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.sku}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-destructive font-bold">{item.quantity}</span>
                      <span className="text-muted-foreground">/{item.minStock}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por categoria */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por Categoria</CardTitle></CardHeader>
          <CardContent>
            {!data?.byCategory?.length ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma categoria cadastrada.</p>
            ) : (
              <div className="space-y-3">
                {data.byCategory.map((cat: any) => {
                  const maxCount = data.byCategory[0]?.count || 1
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                        <span className="font-medium">{cat.count} un.</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(cat.count / maxCount) * 100}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Movimentações recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Movimentações Recentes</CardTitle>
          <Link href="/inventory/movements"><Button variant="ghost" size="sm">Ver todas</Button></Link>
        </CardHeader>
        <CardContent>
          {!data?.recentMovements?.length ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="space-y-2">
              {data.recentMovements.map((m: any) => {
                const mt = moveTypeMap[m.type] || moveTypeMap.adjustment
                const Icon = mt.icon
                return (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${mt.cls}`} />
                      <div className="min-w-0">
                        <span className="font-medium">{m.item?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground ml-2">{mt.label}</span>
                        {m.reason && <p className="text-xs text-muted-foreground truncate">{m.reason}</p>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`font-mono font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                      <p className="text-xs text-muted-foreground">{format(new Date(m.createdAt), "dd/MM HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
