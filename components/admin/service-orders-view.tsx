// =============================================================================
// ServiceOrdersView - listagem e gestão de Ordens de Serviço (OS)
// =============================================================================
// Componente customizado (não usa CrudTable porque OS tem fluxo mais rico:
// status com workflow, atribuição de técnico, agendamento etc.)
//
// Para extender em etapas futuras (ex: agenda visual, anexos, materiais),
// adicionar abas/sub-componentes sem alterar a estrutura existente.
// =============================================================================
'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import {
  Plus, Search, Pencil, Trash2, Loader2, ClipboardList, ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// =============================================================================
// Constantes - tipos, status, prioridades
// =============================================================================
const TYPES = [
  { value: 'installation', label: 'Instalação' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'visit', label: 'Visita técnica' },
  { value: 'removal', label: 'Retirada' },
  { value: 'change', label: 'Mudança / Transferência' },
  { value: 'other', label: 'Outros' },
]

const STATUSES = [
  { value: 'open', label: 'Aberta', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { value: 'scheduled', label: 'Agendada', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { value: 'in_progress', label: 'Em andamento', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  { value: 'completed', label: 'Concluída', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
]

const PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const typeLabel = (v: string) => TYPES.find((x) => x.value === v)?.label ?? v
const statusInfo = (v: string) => STATUSES.find((x) => x.value === v) ?? { label: v, color: 'bg-muted text-muted-foreground' }
const priorityLabel = (v: string) => PRIORITIES.find((x) => x.value === v)?.label ?? v

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ServiceOrdersView() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const url = `/api/admin/service-orders${params.toString() ? `?${params.toString()}` : ''}`
  const { data, isLoading } = useSWR<any[]>(url, fetcher)

  const [editing, setEditing] = useState<any | 'new' | null>(null)
  const [deleting, setDeleting] = useState<any | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const refresh = () => globalMutate(url)

  const confirmDelete = async () => {
    if (!deleting) return
    setDeletingLoading(true)
    try {
      const r = await fetch(`/api/admin/service-orders/${deleting.id}`, { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(d?.error ?? 'Erro ao excluir'); return }
      toast.success('OS excluída com sucesso')
      setDeleting(null); refresh()
    } finally { setDeletingLoading(false) }
  }

  return (
    <div className="space-y-4">
      {/* ----- Header ----- */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Ordens de Serviço
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie instalações, manutenções, visitas e demais atendimentos técnicos.
          </p>
        </div>
        <Button onClick={() => setEditing('new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </div>

      {/* ----- Filtros ----- */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número ou título..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ----- Listagem ----- */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma OS encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Número</th>
                    <th className="px-4 py-3 text-left font-medium">Título</th>
                    <th className="px-4 py-3 text-left font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium">Técnico</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Agendado</th>
                    <th className="px-4 py-3 text-right font-medium w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((row: any) => {
                    const sInfo = statusInfo(row.status)
                    return (
                      <tr key={row.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{row.number}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{row.title}</div>
                          {row.priority && row.priority !== 'normal' && (
                            <div className="text-xs text-muted-foreground">Prioridade: {priorityLabel(row.priority)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">{row.customer?.name ?? '-'}</td>
                        <td className="px-4 py-3">{row.technician?.name ?? '-'}</td>
                        <td className="px-4 py-3 text-xs">{typeLabel(row.type)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sInfo.color}`}>
                            {sInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {row.scheduledFor
                            ? new Date(row.scheduledFor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditing(row)} className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleting(row)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----- Dialog de criação/edição ----- */}
      <ServiceOrderDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        record={editing === 'new' ? null : editing}
        onSaved={() => { setEditing(null); refresh() }}
      />

      {/* ----- Dialog confirmação exclusão ----- */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir OS {deleting?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A ordem de serviço será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletingLoading}
              className="bg-red-600 hover:bg-red-700">
              {deletingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// =============================================================================
// Dialog dedicado de OS - com pickers customizados de cliente/técnico/cidade
// =============================================================================
interface DialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  record: any | null
  onSaved: () => void
}

function ServiceOrderDialog({ open, onOpenChange, record, onSaved }: DialogProps) {
  const isEdit = !!record
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')

  // SWR de listas auxiliares
  const { data: technicians } = useSWR<any[]>(open ? '/api/admin/technicians' : null, fetcher)
  const { data: cities } = useSWR<any[]>(open ? '/api/admin/cities' : null, fetcher)
  const { data: customerSearchData } = useSWR<{ results: any[] }>(
    open && customerSearch.length >= 2 ? `/api/customers/search?q=${encodeURIComponent(customerSearch)}` : null,
    fetcher,
  )
  const customerSearchResults = customerSearchData?.results ?? []

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  // Inicializa o formulário ao abrir
  useEffect(() => {
    if (!open) return
    setForm({
      title: record?.title ?? '',
      description: record?.description ?? '',
      type: record?.type ?? 'installation',
      priority: record?.priority ?? 'normal',
      status: record?.status ?? 'open',
      customerId: record?.customerId ?? '',
      customerName: record?.customer?.name ?? '',
      technicianId: record?.technicianId ?? '',
      cityId: record?.cityId ?? '',
      address: record?.address ?? '',
      scheduledFor: record?.scheduledFor ? new Date(record.scheduledFor).toISOString().slice(0, 16) : '',
    })
    setCustomerSearch('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record?.id])

  const submit = async () => {
    if (!form.title?.trim()) { toast.error('Título é obrigatório'); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        type: form.type,
        priority: form.priority,
        status: form.status,
        customerId: form.customerId || null,
        technicianId: form.technicianId || null,
        cityId: form.cityId || null,
        address: form.address || null,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
      }
      const url = isEdit ? `/api/admin/service-orders/${record.id}` : '/api/admin/service-orders'
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(d?.error ?? 'Erro ao salvar'); return }
      toast.success(isEdit ? 'OS atualizada' : 'OS criada com sucesso')
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar OS ${record?.number}` : 'Nova Ordem de Serviço'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
          {/* Título */}
          <div className="md:col-span-2 space-y-1.5">
            <Label>Título <span className="text-red-500">*</span></Label>
            <Input value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Instalação cliente João Silva" />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.type || 'installation'} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente - com busca */}
          <div className="md:col-span-2 space-y-1.5">
            <Label>Cliente</Label>
            {form.customerId && form.customerName ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <span className="flex-1 text-sm">{form.customerName}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => { set('customerId', ''); set('customerName', '') }}>
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Digite nome ou documento..."
                />
                {customerSearch.length >= 2 && customerSearchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-56 overflow-y-auto">
                    {customerSearchResults.slice(0, 10).map((c: any) => (
                      <button
                        key={c.id} type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          set('customerId', c.id); set('customerName', c.name); setCustomerSearch('')
                        }}
                      >
                        <div className="font-medium">{c.name}</div>
                        {c.document && <div className="text-xs text-muted-foreground">{c.document}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status || 'open'} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Técnico */}
          <div className="space-y-1.5">
            <Label>Técnico</Label>
            <Select value={form.technicianId || 'none'} onValueChange={(v) => set('technicianId', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sem técnico —</SelectItem>
                {technicians?.filter((t: any) => t.active).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cidade */}
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Select value={form.cityId || 'none'} onValueChange={(v) => set('cityId', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sem cidade —</SelectItem>
                {cities?.filter((c: any) => c.active).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} - {c.state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={form.priority || 'normal'} onValueChange={(v) => set('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Agendamento */}
          <div className="md:col-span-2 space-y-1.5">
            <Label>Agendamento</Label>
            <Input type="datetime-local" value={form.scheduledFor || ''}
              onChange={(e) => set('scheduledFor', e.target.value)} />
          </div>

          {/* Endereço */}
          <div className="md:col-span-3 space-y-1.5">
            <Label>Endereço de atendimento</Label>
            <Input value={form.address || ''} onChange={(e) => set('address', e.target.value)}
              placeholder="Rua, número, bairro..." />
          </div>

          {/* Descrição */}
          <div className="md:col-span-3 space-y-1.5">
            <Label>Descrição / Observações</Label>
            <Textarea rows={4} value={form.description || ''} onChange={(e) => set('description', e.target.value)}
              placeholder="Detalhes do atendimento, ponto de instalação, equipamentos..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar OS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
