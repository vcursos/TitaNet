// =============================================================================
// NetworkMonitorView - dashboard de monitoramento de rede em tempo real
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Wifi, WifiOff, Activity, Server, AlertTriangle, RefreshCw,
  Signal, Loader2, ShieldAlert, ArrowUpDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function signalBadge(dbm: number | null | undefined) {
  if (dbm == null) return null
  const v = Number(dbm)
  let cls = 'text-green-600 bg-green-50 dark:bg-green-950/30'
  if (v < -27) cls = 'text-destructive bg-destructive/10'
  else if (v < -22) cls = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      <Signal className="h-3 w-3" />{v.toFixed(1)} dBm
    </span>
  )
}

export function NetworkMonitorView() {
  const { data, isLoading, mutate } = useSWR('/api/network/monitor', fetcher, { refreshInterval: 30000 })
  const [syncing, setSyncing] = useState<string | null>(null)

  async function handleSync(serverId: string) {
    setSyncing(serverId)
    try {
      const res = await fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erro na sincronização')
      toast.success(`Sincronizado: ${result.server} - ${result.onlineCount ?? result.checked ?? 0} conexões`)
      mutate()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSyncing(null)
    }
  }

  async function handleSyncAll() {
    if (!data?.servers?.length) return
    for (const s of data.servers) {
      await handleSync(s.id)
    }
  }

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-64" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monitor de Rede</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral das conexões em tempo real (atualiza a cada 30s)</p>
        </div>
        <Button variant="outline" onClick={handleSyncAll} disabled={!!syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sincronizar Todos
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30"><Wifi className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{data?.online ?? 0}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30"><WifiOff className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold">{data?.offline ?? 0}</p>
              <p className="text-xs text-muted-foreground">Offline</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950/30"><ShieldAlert className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold">{data?.blocked ?? 0}</p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30"><Activity className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{data?.onlinePercent ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Disponibilidade</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servidores */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Servidores de Rede</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.servers?.length ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Nenhum servidor de rede cadastrado. <Link href="/administration/servers" className="text-primary underline">Cadastrar servidor</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {data.servers.map((s: any) => (
                <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{s.type}</span>
                        {s.pop?.name && <span className="text-xs text-muted-foreground">{s.pop.name}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.host || 'Sem host'}
                        {s.lastSyncAt && <> • Última sync: {format(new Date(s.lastSyncAt), "dd/MM HH:mm", { locale: ptBR })}</>}
                        {s.onlineClients != null && <> • {s.onlineClients} online</>}
                      </div>
                      {s.lastSyncError && <p className="text-xs text-destructive mt-1">⚠ {s.lastSyncError}</p>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(s.id)}
                    disabled={syncing === s.id}
                  >
                    {syncing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="ml-1">Sync</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sinal fraco */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" /> Sinal Fraco
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.lowSignal?.length ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum cliente com sinal crítico.</p>
            ) : (
              <div className="space-y-2">
                {data.lowSignal.map((c: any) => (
                  <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                    <div>
                      <span className="text-sm font-medium">{c.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {c.equipment || 'Sem equip.'} {c.ipAddress && `• ${c.ipAddress}`}
                      </div>
                    </div>
                    {signalBadge(c.signalDbm)}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conexões recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" /> Conexões Recentes
            </CardTitle>
            <Link href="/network/connections">
              <Button variant="ghost" size="sm">Ver todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!data?.recentConnections?.length ? (
              <p className="text-muted-foreground text-sm text-center py-4">Execute uma sincronização para ver as conexões.</p>
            ) : (
              <div className="space-y-2">
                {data.recentConnections.slice(0, 8).map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      {conn.status === 'online' ? <Wifi className="h-3 w-3 text-green-500 shrink-0" /> : <WifiOff className="h-3 w-3 text-destructive shrink-0" />}
                      <span className="truncate font-medium">{conn.customer?.name || conn.pppoeUser || 'Desconhecido'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0 ml-2">
                      {conn.ipAddress && <span>{conn.ipAddress}</span>}
                      {conn.rxRate && <span className="ml-2">↓{conn.rxRate}</span>}
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
