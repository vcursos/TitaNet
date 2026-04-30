// =============================================================================
// MessageLogsView - histórico de mensagens enviadas
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Search, Mail, MessageSquare, Phone, CheckCircle2, XCircle,
  Clock, AlertCircle, Eye, Inbox,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function channelIcon(ch: string) {
  if (ch === 'sms') return <Phone className="h-4 w-4" />
  if (ch === 'whatsapp') return <MessageSquare className="h-4 w-4" />
  return <Mail className="h-4 w-4" />
}

function channelLabel(ch: string) {
  if (ch === 'sms') return 'SMS'
  if (ch === 'whatsapp') return 'WhatsApp'
  return 'E-mail'
}

function statusBadge(status: string) {
  const map: Record<string, { icon: any; label: string; cls: string }> = {
    sent: { icon: CheckCircle2, label: 'Enviado', cls: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
    delivered: { icon: CheckCircle2, label: 'Entregue', cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
    failed: { icon: XCircle, label: 'Falhou', cls: 'text-destructive bg-destructive/10' },
    pending: { icon: Clock, label: 'Pendente', cls: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' },
  }
  const s = map[status] || map.pending
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      <Icon className="h-3 w-3" />{s.label}
    </span>
  )
}

export function MessageLogsView() {
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [viewLog, setViewLog] = useState<any>(null)

  // Debounce search
  useState(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(timer)
  })

  const params = new URLSearchParams()
  if (channelFilter !== 'all') params.set('channel', channelFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (search) params.set('search', search)

  const { data: logs, isLoading } = useSWR(
    `/api/communication/logs?${params.toString()}`,
    fetcher,
  )

  // Contadores
  const sentCount = logs?.filter((l: any) => l.status === 'sent' || l.status === 'delivered').length || 0
  const failedCount = logs?.filter((l: any) => l.status === 'failed').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Mensagens</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe todas as mensagens enviadas aos clientes</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{logs?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-green-600">{sentCount}</p>
          <p className="text-xs text-muted-foreground">Enviados</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold text-destructive">{failedCount}</p>
          <p className="text-xs text-muted-foreground">Falhas</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{logs?.filter((l: any) => l.channel === 'email').length || 0}</p>
          <p className="text-xs text-muted-foreground">E-mails</p>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por destinatário ou cliente..." className="pl-9" />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !logs?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma mensagem encontrada.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {channelIcon(log.channel)}
                    <span className="font-medium text-sm">{log.customer?.name || 'Cliente removido'}</span>
                    {statusBadge(log.status)}
                    {log.template && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{log.template.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{log.recipient}</span>
                    {log.subject && <span className="truncate max-w-[200px]">• {log.subject}</span>}
                    <span>• {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                  </div>
                  {log.error && <p className="text-xs text-destructive mt-1">{log.error}</p>}
                </div>
                <Button variant="ghost" size="icon" title="Ver detalhes" onClick={() => setViewLog(log)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de detalhes */}
      <Dialog open={!!viewLog} onOpenChange={open => !open && setViewLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes da Mensagem</DialogTitle></DialogHeader>
          {viewLog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Canal:</span> {channelLabel(viewLog.channel)}</div>
                <div><span className="text-muted-foreground">Status:</span> {statusBadge(viewLog.status)}</div>
                <div><span className="text-muted-foreground">Destinatário:</span> {viewLog.recipient}</div>
                <div><span className="text-muted-foreground">Cliente:</span> {viewLog.customer?.name || '-'}</div>
                <div><span className="text-muted-foreground">Template:</span> {viewLog.template?.name || 'Manual'}</div>
                <div><span className="text-muted-foreground">Data:</span> {format(new Date(viewLog.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</div>
              </div>
              {viewLog.subject && (
                <div className="text-sm"><span className="text-muted-foreground">Assunto:</span> {viewLog.subject}</div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Corpo:</span>
                <div className="bg-muted/50 p-3 rounded-md whitespace-pre-wrap text-sm mt-1">{viewLog.body}</div>
              </div>
              {viewLog.error && (
                <div className="text-sm text-destructive"><AlertCircle className="h-4 w-4 inline mr-1" />{viewLog.error}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
