'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import Link from 'next/link'
import { Plus, Search, Users, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerFormDialog } from './customer-form-dialog'
import { formatDocument, formatPhone, formatBRL, statusLabel } from '@/lib/format'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CustomersView() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [openNew, setOpenNew] = useState(false)

  const qs = new URLSearchParams()
  if (search) qs.set('search', search)
  if (status !== 'all') qs.set('status', status)
  const url = `/api/customers?${qs.toString()}`
  const { data, isLoading } = useSWR(url, fetcher)

  const customers: any[] = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie os clientes do seu provedor.</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="gap-2">
          <Plus className="size-4" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CPF/CNPJ, email ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="overdue">Inadimplentes</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="size-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Cadastre o primeiro cliente do seu provedor.</p>
              <Button onClick={() => setOpenNew(true)} className="mt-4 gap-2"><Plus className="size-4" /> Novo Cliente</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="hidden md:grid grid-cols-[2.5fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Cliente</div>
                <div>Documento</div>
                <div>Plano</div>
                <div>Status</div>
                <div>Conexão</div>
                <div></div>
              </div>
              {customers.map((c) => {
                const st = statusLabel(c.status)
                return (
                  <Link key={c.id} href={`/customers/${c.id}`} className="grid grid-cols-1 md:grid-cols-[2.5fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 hover:bg-muted/50 transition items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold shrink-0">
                        {c.name?.[0]?.toUpperCase() ?? 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.email ?? formatPhone(c.phone)}</div>
                      </div>
                    </div>
                    <div className="text-sm font-mono">{formatDocument(c.document)}</div>
                    <div className="text-sm">
                      <div>{c.plan?.name ?? <span className="text-muted-foreground">Sem plano</span>}</div>
                      <div className="text-xs text-muted-foreground">{formatBRL(c.monthlyPrice ?? c.plan?.price)}</div>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {c.isOnline ? (
                        <><Wifi className="size-3.5 text-green-600" /> <span className="text-green-600">Online</span></>
                      ) : (
                        <><WifiOff className="size-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Offline</span></>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">Ver →</div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={openNew}
        onOpenChange={setOpenNew}
        onSaved={() => { mutate(url); setOpenNew(false) }}
      />
    </div>
  )
}
