// =============================================================================
// MovementsView - histórico de movimentações de estoque
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Search, ArrowDown, ArrowUp, Settings2, RotateCcw,
  ArrowRightLeft, Wrench, Inbox,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const moveTypeMap: Record<string, { label: string; icon: any; cls: string }> = {
  in: { label: 'Entrada', icon: ArrowDown, cls: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
  out: { label: 'Saída', icon: ArrowUp, cls: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
  install: { label: 'Instalação', icon: Settings2, cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  return: { label: 'Devolução', icon: RotateCcw, cls: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
  transfer: { label: 'Transferência', icon: ArrowRightLeft, cls: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' },
  adjustment: { label: 'Ajuste', icon: Wrench, cls: 'text-muted-foreground bg-muted' },
}

export function MovementsView() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (typeFilter !== 'all') params.set('type', typeFilter)

  const { data: movements, isLoading } = useSWR(
    `/api/inventory/movements?${params.toString()}`,
    fetcher,
  )

  // Contadores
  const entries = movements?.filter((m: any) => m.quantity > 0).length || 0
  const exits = movements?.filter((m: any) => m.quantity < 0).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movimentações de Estoque</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico de entradas, saídas, instalações e devoluções</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{movements?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-green-600">{entries}</p>
          <p className="text-xs text-muted-foreground">Entradas</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-destructive">{exits}</p>
          <p className="text-xs text-muted-foreground">Saídas</p>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por item ou motivo..." className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(moveTypeMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !movements?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma movimentação encontrada.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {movements.map((m: any) => {
            const mt = moveTypeMap[m.type] || moveTypeMap.adjustment
            const Icon = mt.icon
            return (
              <Card key={m.id}>
                <CardContent className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg ${mt.cls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{m.item?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground font-mono">{m.item?.sku || ''}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${mt.cls}`}>{mt.label}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        {m.reason && <span>{m.reason}</span>}
                        {m.reference && <span>Ref: {m.reference}</span>}
                        {m.customer && <span>Cliente: {m.customer.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-lg font-mono font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                    <p className="text-xs text-muted-foreground">{m.previousQty} → {m.newQty}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(m.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
