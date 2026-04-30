'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft, FileText, Send, Trash2, Download, Loader2, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatBRL, formatDocument, statusLabel } from '@/lib/format'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ContractDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: contract, isLoading, mutate } = useSWR(`/api/contracts/${id}`, fetcher)
  const [loading, setLoading] = useState<string | null>(null)

  const sendForSignature = async () => {
    setLoading('send')
    try {
      const r = await fetch('/api/integrations/signature/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: id }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success(`Enviado: ${d?.signatureRequestId}${d?.mocked ? ' (modo simulado)' : ''}`)
      mutate()
    } finally { setLoading(null) }
  }

  const markSigned = async () => {
    setLoading('signed')
    try {
      const r = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed', signedAt: new Date().toISOString() }),
      })
      if (!r.ok) { toast.error('Erro'); return }
      toast.success('Contrato marcado como assinado')
      mutate()
    } finally { setLoading(null) }
  }

  const remove = async () => {
    const r = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
    if (!r.ok) { toast.error('Erro ao remover'); return }
    toast.success('Contrato removido')
    router.push('/contracts')
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
  if (!contract || contract?.error) return <div className="text-center py-12">Contrato não encontrado.</div>

  const st = statusLabel(contract.status)
  const c = contract.customer ?? {}

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/contracts"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="size-4" /> Contratos</Button></Link>
        <div className="flex-1" />
        <a href={`/api/contracts/${id}/pdf`} target="_blank" rel="noopener"><Button variant="outline" size="sm" className="gap-2"><Download className="size-4" /> Visualizar / PDF</Button></a>
        {contract.status === 'draft' && (
          <Button size="sm" onClick={sendForSignature} disabled={loading === 'send'} className="gap-2">
            {loading === 'send' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar para assinatura
          </Button>
        )}
        {contract.status !== 'signed' && (
          <Button size="sm" variant="outline" onClick={markSigned} disabled={loading === 'signed'} className="gap-2">
            <CheckCircle2 className="size-4" /> Marcar assinado
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-destructive"><Trash2 className="size-4" /> Excluir</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="size-12 rounded-md bg-primary/10 text-primary grid place-items-center mb-3"><FileText className="size-6" /></div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{contract.contractNumber}</h1>
              <div className="text-sm text-muted-foreground mt-1">Emitido em {format(new Date(contract.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
              <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Mensalidade</div>
              <div className="font-display text-2xl font-bold">{formatBRL(contract.monthlyPrice)}</div>
              <div className="text-xs text-muted-foreground">{contract.plan?.name ?? '-'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span>{c.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Documento</span><span className="font-mono">{formatDocument(c.document)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{c.email ?? '-'}</span></div>
            <Link href={`/customers/${c.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
              Ver cliente <ExternalLink className="size-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vigência & Assinatura</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Início</span><span>{contract.startDate ? format(new Date(contract.startDate), 'dd/MM/yyyy') : '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Término</span><span>{contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : 'Indeterminado'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Provedor de assinatura</span><span>{contract.signatureProvider ?? 'Não configurado'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Referência externa</span><span className="font-mono text-xs">{contract.signatureRequestId ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Assinado em</span><span>{contract.signedAt ? format(new Date(contract.signedAt), 'dd/MM/yyyy HH:mm') : '-'}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Conteúdo / Pré-visualização</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Clique no botão abaixo para abrir o contrato em uma nova aba e imprimir/salvar como PDF.</p>
          <a href={`/api/contracts/${id}/pdf`} target="_blank" rel="noopener">
            <Button className="gap-2"><Download className="size-4" /> Abrir Contrato</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
