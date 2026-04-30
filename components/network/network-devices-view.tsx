// =============================================================================
// NetworkDevicesView - visão de equipamentos de rede (wrapper sobre admin/servers)
// com foco em monitoramento e sync
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Server, RefreshCw, Loader2, Wifi, WifiOff, AlertTriangle,
  CheckCircle2, Clock, Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function typeColor(t: string) {
  const m: Record<string, string> = {
    mikrotik: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    olt: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
    radius: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    dns: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
    dhcp: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  }
  return m[t] || 'bg-muted text-muted-foreground'
}

export function NetworkDevicesView() {
  const { data: servers, isLoading, mutate } = useSWR('/api/admin/servers', fetcher)
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
      if (!res.ok) throw new Error(result.error || 'Erro')
      toast.success(`Sincronizado: ${result.server}`)
      mutate()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSyncing(null)
    }
  }

  const networkServers = (servers || []).filter((s: any) => ['mikrotik', 'olt', 'radius'].includes(s.type))
  const otherServers = (servers || []).filter((s: any) => !['mikrotik', 'olt', 'radius'].includes(s.type))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipamentos de Rede</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie e monitore seus servidores, roteadores e OLTs</p>
        </div>
        <Link href="/administration/servers">
          <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Gerenciar Servidores</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : !networkServers.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Server className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum equipamento de rede cadastrado.</p>
          <Link href="/administration/servers" className="text-primary underline text-sm">Cadastrar agora</Link>
        </CardContent></Card>
      ) : (
        <>
          {/* Equipamentos de rede com sync */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {networkServers.map((s: any) => (
              <Card key={s.id} className={!s.active ? 'opacity-50' : ''}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-muted">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{s.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor(s.type)}`}>{s.type}</span>
                          {!s.active && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Inativo</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{s.host || 'Sem host'}{s.port ? `:${s.port}` : ''}</p>
                      </div>
                    </div>
                    {s.active && ['mikrotik', 'olt', 'radius'].includes(s.type) && (
                      <Button variant="outline" size="sm" onClick={() => handleSync(s.id)} disabled={syncing === s.id}>
                        {syncing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>

                  {/* Status sync */}
                  <div className="mt-4 pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">POP:</span>
                      <span>{s.pop?.name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Última sincronização:</span>
                      <span className="flex items-center gap-1">
                        {s.lastSyncAt ? (
                          <><CheckCircle2 className="h-3 w-3 text-green-500" />{formatDistanceToNow(new Date(s.lastSyncAt), { addSuffix: true, locale: ptBR })}</>
                        ) : (
                          <><Clock className="h-3 w-3 text-muted-foreground" />Nunca</>  
                        )}
                      </span>
                    </div>
                    {s.onlineClients != null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Clientes online:</span>
                        <span className="flex items-center gap-1"><Wifi className="h-3 w-3 text-green-500" />{s.onlineClients}</span>
                      </div>
                    )}
                    {s.lastSyncError && (
                      <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                        <AlertTriangle className="h-3 w-3" />{s.lastSyncError}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Outros servidores (apenas info) */}
          {otherServers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Outros Servidores</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {otherServers.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor(s.type)}`}>{s.type}</span>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{s.host || ''}</span>
                      </div>
                      {s.active ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
