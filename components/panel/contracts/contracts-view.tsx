'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { FileSignature, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, statusLabel } from '@/lib/format'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ContractsView() {
  const { data, isLoading } = useSWR('/api/contracts', fetcher)
  const contracts: any[] = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Contratos</h1>
        <p className="text-muted-foreground mt-1">Contratos gerados para os clientes do provedor.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : contracts.length === 0 ? (
            <div className="p-12 text-center">
              <FileSignature className="size-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold">Nenhum contrato gerado</h3>
              <p className="text-sm text-muted-foreground mt-1">Acesse a página de um cliente para gerar um contrato.</p>
              <Link href="/customers" className="text-primary text-sm hover:underline mt-3 inline-block">Ir para Clientes</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Contrato</div>
                <div>Cliente</div>
                <div>Plano</div>
                <div>Valor</div>
                <div>Status</div>
                <div></div>
              </div>
              {contracts.map((c) => {
                const st = statusLabel(c.status)
                return (
                  <Link key={c.id} href={`/contracts/${c.id}`} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 hover:bg-muted/50 transition items-center">
                    <div>
                      <div className="font-mono text-sm">{c.contractNumber}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "dd MMM yyyy", { locale: ptBR })}</div>
                    </div>
                    <div className="font-medium">{c.customer?.name}</div>
                    <div className="text-sm text-muted-foreground">{c.plan?.name ?? '-'}</div>
                    <div className="font-medium">{formatBRL(c.monthlyPrice)}</div>
                    <div><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span></div>
                    <div><ExternalLink className="size-4 text-muted-foreground" /></div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
