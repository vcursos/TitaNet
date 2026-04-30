// =============================================================================
// ConnectionsView - lista de conexões ativas com detalhes de tráfego
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Search, Wifi, WifiOff, ArrowDown, ArrowUp, Server,
  RefreshCw, Loader2, Network, Monitor,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function formatBytes(bytes: string | number): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (!b || isNaN(b)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = b
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}

function statusIcon(status: string) {
  if (status === 'online') return <Wifi className="h-4 w-4 text-green-500" />
  if (status === 'blocked') return <WifiOff className="h-4 w-4 text-yellow-500" />
  return <WifiOff className="h-4 w-4 text-destructive" />
}

export function ConnectionsView() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serverFilter, setServerFilter] = useState('all')

  const { data: servers } = useSWR('/api/admin/servers', fetcher)
  const networkServers = (servers || []).filter((s: any) => ['mikrotik', 'olt', 'radius'].includes(s.type))

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (serverFilter !== 'all') params.set('serverId', serverFilter)

  const { data: connections, isLoading, mutate } = useSWR(
    `/api/network/connections?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 },
  )

  const [syncing, setSyncing] = useState(false)
  async function handleSyncAll() {
    setSyncing(true)
    try {
      for (const s of networkServers) {
        await fetch('/api/network/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverId: s.id }),
        })
      }
      toast.success('Sincronização concluída')
      mutate()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSyncing(false)
    }
  }

  const onlineCount = connections?.filter((c: any) => c.status === 'online').length || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Conexões Ativas</h1>
          <p className="text-muted-foreground text-sm mt-1">Detalhes de todas as sessões PPPoE e conexões de clientes</p>
        </div>
        <Button variant="outline" onClick={handleSyncAll} disabled={syncing}>
          {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{connections?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
          <p className="text-xs text-muted-foreground">Online</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-destructive">{(connections?.length || 0) - onlineCount}</p>
          <p className="text-xs text-muted-foreground">Offline/Bloq.</p>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, IP ou PPPoE..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serverFilter} onValueChange={setServerFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Servidor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos servidores</SelectItem>
            {networkServers.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : !connections?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Network className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma conexão encontrada. Execute uma sincronização primeiro.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-1"></div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">PPPoE / IP</div>
            <div className="col-span-1">Servidor</div>
            <div className="col-span-1">Uptime</div>
            <div className="col-span-2">Tráfego</div>
            <div className="col-span-2">Perfil</div>
          </div>

          {connections.map((conn: any) => (
            <Card key={conn.id}>
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 flex justify-center">{statusIcon(conn.status)}</div>
                  <div className="col-span-3">
                    {conn.customer ? (
                      <Link href={`/customers/${conn.customer.id}`} className="text-sm font-medium hover:underline">{conn.customer.name}</Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">Desconhecido</span>
                    )}
                    {conn.customer?.plan && <p className="text-xs text-muted-foreground">{conn.customer.plan.name}</p>}
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-mono">{conn.pppoeUser || '-'}</p>
                    <p className="text-xs font-mono text-muted-foreground">{conn.ipAddress || '-'}</p>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs">{conn.server?.name || '-'}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-muted-foreground">{conn.uptime || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-0.5 text-green-600"><ArrowDown className="h-3 w-3" />{conn.rxRate || '-'}</span>
                      <span className="flex items-center gap-0.5 text-blue-600"><ArrowUp className="h-3 w-3" />{conn.txRate || '-'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">↓{formatBytes(conn.rxBytes)} / ↑{formatBytes(conn.txBytes)}</p>
                  </div>
                  <div className="col-span-2">
                    {conn.profileName ? (
                      <div className="text-xs">
                        <span className="font-medium">{conn.profileName}</span>
                        <p className="text-muted-foreground">↓{conn.maxDownload || '-'} / ↑{conn.maxUpload || '-'}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem perfil</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
