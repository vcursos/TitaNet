'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Edit, Trash2, FileSignature, ShieldCheck, Wifi, WifiOff,
  Network, Activity, Mail, Phone, MapPin, Loader2, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CustomerFormDialog } from './customer-form-dialog'
import { formatDocument, formatPhone, formatBRL, formatCEP, statusLabel } from '@/lib/format'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CustomerDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: customer, isLoading, mutate } = useSWR(`/api/customers/${id}`, fetcher)
  const [editOpen, setEditOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const checkReceita = async () => {
    setActionLoading('receita')
    try {
      const r = await fetch('/api/integrations/receita-federal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success(`Receita Federal: ${d?.data?.status ?? 'consultado'}${d?.mocked ? ' (modo simulado)' : ''}`)
      mutate()
    } finally { setActionLoading(null) }
  }

  const checkSignal = async () => {
    setActionLoading('signal')
    try {
      const r = await fetch('/api/integrations/olt/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success(`Sinal ONU: ${d?.data?.signalDbm} dBm (${d?.data?.status})${d?.mocked ? ' — simulado' : ''}`)
      mutate()
    } finally { setActionLoading(null) }
  }

  const checkMikrotik = async () => {
    setActionLoading('mikrotik')
    try {
      const r = await fetch('/api/integrations/mikrotik/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success(`MikroTik: ${d?.data?.isOnline ? 'Online' : 'Offline'}${d?.mocked ? ' — simulado' : ''}`)
      mutate()
    } finally { setActionLoading(null) }
  }

  const generateContract = async () => {
    setActionLoading('contract')
    try {
      const r = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success('Contrato gerado!')
      router.push(`/contracts/${d.id}`)
    } finally { setActionLoading(null) }
  }

  const deleteCustomer = async () => {
    const r = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    if (!r.ok) { toast.error('Erro ao remover'); return }
    toast.success('Cliente removido')
    router.push('/customers')
  }

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
  }
  if (!customer || customer?.error) {
    return <div className="text-center py-12">Cliente não encontrado. <Link href="/customers" className="text-primary">Voltar</Link></div>
  }

  const st = statusLabel(customer.status)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/customers"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="size-4" /> Clientes</Button></Link>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-2"><Edit className="size-4" /> Editar</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive"><Trash2 className="size-4" /> Excluir</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita. Os contratos vinculados também serão removidos.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteCustomer} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start gap-5">
            <div className="size-16 rounded-full bg-primary/10 text-primary grid place-items-center text-2xl font-bold shrink-0">
              {customer.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">{customer.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                  {customer.isOnline ? <><Wifi className="size-3 text-green-600" /> Online</> : <><WifiOff className="size-3 text-muted-foreground" /> Offline</>}
                </span>
              </div>
              <div className="text-muted-foreground text-sm mt-1">{formatDocument(customer.document)} • {customer.documentType}</div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm">
                {customer.email && <span className="flex items-center gap-1.5"><Mail className="size-3.5 text-muted-foreground" /> {customer.email}</span>}
                {customer.phone && <span className="flex items-center gap-1.5"><Phone className="size-3.5 text-muted-foreground" /> {formatPhone(customer.phone)}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Mensalidade</div>
              <div className="font-display text-2xl font-bold">{formatBRL(customer.monthlyPrice ?? customer.plan?.price)}</div>
              <div className="text-xs text-muted-foreground">{customer.plan?.name ?? 'Sem plano'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Button variant="outline" onClick={checkReceita} disabled={actionLoading === 'receita'} className="h-auto py-4 justify-start gap-3">
          {actionLoading === 'receita' ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5 text-primary" />}
          <div className="text-left">
            <div className="font-semibold">Verificar na Receita Federal</div>
            <div className="text-xs text-muted-foreground">Consultar situação do CPF/CNPJ</div>
          </div>
        </Button>
        <Button variant="outline" onClick={checkSignal} disabled={actionLoading === 'signal'} className="h-auto py-4 justify-start gap-3">
          {actionLoading === 'signal' ? <Loader2 className="size-5 animate-spin" /> : <Activity className="size-5 text-primary" />}
          <div className="text-left">
            <div className="font-semibold">Verificar Sinal ONU</div>
            <div className="text-xs text-muted-foreground">Consulta na OLT (mocked)</div>
          </div>
        </Button>
        <Button variant="outline" onClick={checkMikrotik} disabled={actionLoading === 'mikrotik'} className="h-auto py-4 justify-start gap-3">
          {actionLoading === 'mikrotik' ? <Loader2 className="size-5 animate-spin" /> : <Network className="size-5 text-primary" />}
          <div className="text-left">
            <div className="font-semibold">Status no MikroTik</div>
            <div className="text-xs text-muted-foreground">Sessão PPPoE atual (mocked)</div>
          </div>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4 text-primary" /> Endereço</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>{customer.street ?? '-'}{customer.number ? `, ${customer.number}` : ''}</div>
            {customer.complement && <div className="text-muted-foreground">{customer.complement}</div>}
            <div>{customer.neighborhood ?? '-'}</div>
            <div>{customer.city ?? '-'} / {customer.state ?? '-'}</div>
            <div className="text-muted-foreground">CEP: {formatCEP(customer.zipCode)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Network className="size-4 text-primary" /> Infraestrutura</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Rede / PON</span><span className="font-mono">{customer.network ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Servidor</span><span className="font-mono">{customer.serverHost ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Equipamento</span><span className="font-mono text-xs">{customer.equipment ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">MAC</span><span className="font-mono text-xs">{customer.equipmentMac ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">PPPoE</span><span className="font-mono text-xs">{customer.pppoeUser ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="font-mono text-xs">{customer.ipAddress ?? '-'}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Sinal ONU</span><span className="font-mono">{customer.signalDbm ? `${customer.signalDbm} dBm` : '-'}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><FileSignature className="size-4 text-primary" /> Contratos</CardTitle>
          <Button onClick={generateContract} disabled={actionLoading === 'contract'} size="sm" className="gap-2">
            {actionLoading === 'contract' ? <Loader2 className="size-4 animate-spin" /> : <FileSignature className="size-4" />}
            Gerar contrato
          </Button>
        </CardHeader>
        <CardContent>
          {(customer.contracts ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum contrato gerado para este cliente.</div>
          ) : (
            <div className="divide-y divide-border">
              {customer.contracts.map((ct: any) => (
                <Link key={ct.id} href={`/contracts/${ct.id}`} className="flex items-center justify-between py-2 hover:bg-muted/40 rounded px-2 -mx-2">
                  <div>
                    <div className="font-mono text-sm">{ct.contractNumber}</div>
                    <div className="text-xs text-muted-foreground">{statusLabel(ct.status).label}</div>
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {customer.notes && (
        <Card><CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader><CardContent className="text-sm whitespace-pre-wrap">{customer.notes}</CardContent></Card>
      )}

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} onSaved={() => { setEditOpen(false); mutate() }} />
    </div>
  )
}
