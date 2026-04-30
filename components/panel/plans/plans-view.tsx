'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Plus, Package, Edit, Trash2, Download, Upload, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PlanFormDialog } from './plan-form-dialog'
import { formatBRL } from '@/lib/format'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PlansView() {
  const { data, isLoading } = useSWR('/api/plans', fetcher)
  const [openNew, setOpenNew] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const plans: any[] = Array.isArray(data) ? data : []

  const removePlan = async (id: string) => {
    const r = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    if (!r.ok) { toast.error('Erro ao remover (talvez possua clientes)'); return }
    toast.success('Plano removido')
    mutate('/api/plans')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os planos de internet ofertados.</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="gap-2"><Plus className="size-4" /> Novo Plano</Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full" />)}</div>
      ) : plans.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Package className="size-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">Nenhum plano cadastrado</h3>
          <p className="text-sm text-muted-foreground mt-1">Cadastre o primeiro plano do seu provedor.</p>
          <Button onClick={() => setOpenNew(true)} className="mt-4 gap-2"><Plus className="size-4" /> Novo Plano</Button>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p.id} variant="interactive" className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-md bg-primary/10 text-primary grid place-items-center"><Package className="size-5" /></div>
                  {!p.active && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativo</span>}
                </div>
                <h3 className="font-display text-lg font-bold mt-3 tracking-tight">{p.name}</h3>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
                <div className="font-display text-3xl font-bold mt-3">{formatBRL(p.price)}<span className="text-sm font-normal text-muted-foreground"> /mês</span></div>
                <div className="flex gap-3 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Download className="size-3.5" /> {p.downloadMbps} MB</span>
                  <span className="flex items-center gap-1"><Upload className="size-3.5" /> {p.uploadMbps} MB</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Users className="size-3.5" /> {p._count?.customers ?? 0} cliente(s)</div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => setEditing(p)}><Edit className="size-3.5" /> Editar</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon-sm" className="text-destructive"><Trash2 className="size-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
                        <AlertDialogDescription>O plano “{p.name}” será removido. Clientes vinculados ficarão sem plano.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removePlan(p.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlanFormDialog open={openNew} onOpenChange={setOpenNew} onSaved={() => { mutate('/api/plans'); setOpenNew(false) }} />
      <PlanFormDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} plan={editing} onSaved={() => { mutate('/api/plans'); setEditing(null) }} />
    </div>
  )
}
