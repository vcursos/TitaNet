// =============================================================================
// CrudTable - tabela CRUD genérica reutilizável
// =============================================================================
// Componente que renderiza uma listagem com busca, botão de novo,
// edição inline via dialog genérico e confirmação de exclusão.
// Para criar uma nova página admin, basta declarar `columns` e `fields`.
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Plus, Search, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { GenericFormDialog, type FieldDef } from './generic-form-dialog'

export interface ColumnDef<T = any> {
  key: string
  label: string
  className?: string
  render?: (row: T) => React.ReactNode
}

interface CrudTableProps<T = any> {
  endpoint: string                       // ex: '/api/admin/cities'
  title: string
  description?: string
  columns: ColumnDef<T>[]
  fields: FieldDef[]
  emptyMessage?: string
  searchPlaceholder?: string
  newButtonLabel?: string
  rowKey?: (row: T) => string
  onBeforeDelete?: (row: T) => string | null   // retorna mensagem se não pode excluir
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CrudTable<T extends { id: string }>({
  endpoint,
  title,
  description,
  columns,
  fields,
  emptyMessage = 'Nenhum registro encontrado.',
  searchPlaceholder = 'Buscar...',
  newButtonLabel = 'Novo',
  rowKey,
  onBeforeDelete,
}: CrudTableProps<T>) {
  const [search, setSearch] = useState('')
  const url = `${endpoint}${search ? `?search=${encodeURIComponent(search)}` : ''}`
  const { data, isLoading } = useSWR<T[]>(url, fetcher)

  const [editing, setEditing] = useState<T | null | 'new'>(null)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const refresh = () => globalMutate(url)

  const confirmDelete = async () => {
    if (!deleting) return
    if (onBeforeDelete) {
      const msg = onBeforeDelete(deleting)
      if (msg) { toast.error(msg); setDeleting(null); return }
    }
    setDeletingLoading(true)
    try {
      const r = await fetch(`${endpoint}/${deleting.id}`, { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(d?.error ?? 'Erro ao excluir'); return }
      toast.success('Excluído com sucesso')
      setDeleting(null)
      refresh()
    } finally { setDeletingLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button onClick={() => setEditing('new')} className="gap-2">
          <Plus className="size-4" /> {newButtonLabel}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {columns.map((c) => (
                      <th key={c.key} className={`py-2.5 px-2 ${c.className ?? ''}`}>{c.label}</th>
                    ))}
                    <th className="py-2.5 px-2 w-24 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={(rowKey ?? ((r: any) => r.id))(row)} className="border-b hover:bg-muted/30 transition">
                      {columns.map((c) => (
                        <td key={c.key} className={`py-2.5 px-2 ${c.className ?? ''}`}>
                          {c.render ? c.render(row) : (row as any)[c.key] ?? '-'}
                        </td>
                      ))}
                      <td className="py-2.5 px-2 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(row)} aria-label="Editar">
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleting(row)} aria-label="Excluir" className="text-destructive hover:text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <GenericFormDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === 'new' ? `Novo ${title.replace(/s$/i, '')}` : `Editar ${title.replace(/s$/i, '')}`}
        endpoint={endpoint}
        record={editing === 'new' ? null : editing}
        fields={fields}
        onSaved={() => { setEditing(null); refresh() }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletingLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingLoading ? <Loader2 className="size-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
      <Check className="size-3" /> Ativo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400">
      <X className="size-3" /> Inativo
    </span>
  )
}
