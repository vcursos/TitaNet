// =============================================================================
// ItemsView - listagem e gestão de itens de estoque
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Plus, Search, Loader2, Pencil, Trash2, Package, AlertTriangle,
  ArrowDown, ArrowUp, Settings2, RotateCcw,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  available: { label: 'Disponível', cls: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
  installed: { label: 'Instalado', cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  defective: { label: 'Defeituoso', cls: 'text-destructive bg-destructive/10' },
  reserved: { label: 'Reservado', cls: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' },
  retired: { label: 'Descartado', cls: 'text-muted-foreground bg-muted' },
}

function toBRL(v: any): string {
  const n = Number(v)
  if (isNaN(n) || n === 0) return '-'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const EMPTY_FORM = {
  name: '', description: '', brand: '', model: '', serialNumber: '',
  categoryId: '', quantity: '0', minStock: '5', unitCost: '', unitPrice: '',
  location: '', status: 'available', notes: '',
}

export function ItemsView() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (catFilter !== 'all') params.set('category', catFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('lowStock') === 'true') params.set('lowStock', 'true')

  const { data: items, isLoading, mutate } = useSWR(`/api/inventory/items?${params.toString()}`, fetcher)
  const { data: categories } = useSWR('/api/inventory/categories', fetcher)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Movimentação
  const [moveItem, setMoveItem] = useState<any>(null)
  const [moveType, setMoveType] = useState('in')
  const [moveQty, setMoveQty] = useState('1')
  const [moveReason, setMoveReason] = useState('')
  const [moveSaving, setMoveSaving] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }
  function openEdit(item: any) {
    setEditing(item)
    setForm({
      name: item.name || '', description: item.description || '',
      brand: item.brand || '', model: item.model || '',
      serialNumber: item.serialNumber || '', categoryId: item.categoryId || '',
      quantity: String(item.quantity ?? 0), minStock: String(item.minStock ?? 5),
      unitCost: item.unitCost || '', unitPrice: item.unitPrice || '',
      location: item.location || '', status: item.status || 'available',
      notes: item.notes || '',
    })
    setDialogOpen(true)
  }
  function openMove(item: any) {
    setMoveItem(item)
    setMoveType('in')
    setMoveQty('1')
    setMoveReason('')
    setMoveDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/inventory/items/${editing.id}` : '/api/inventory/items'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro') }
      toast.success(editing ? 'Item atualizado' : 'Item criado')
      setDialogOpen(false)
      mutate()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/inventory/items/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Item excluído')
      mutate()
    } catch (e: any) { toast.error(e.message) } finally { setDeleteId(null) }
  }

  async function handleMove() {
    if (!moveItem || !moveQty) return
    setMoveSaving(true)
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: moveItem.id,
          type: moveType,
          quantity: Number(moveQty),
          reason: moveReason || null,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro') }
      toast.success('Movimentação registrada')
      setMoveDialogOpen(false)
      mutate()
    } catch (e: any) { toast.error(e.message) } finally { setMoveSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Itens de Estoque</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie equipamentos, materiais e consumíveis</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Item</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, SKU, marca ou serial..." className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {(categories || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !items?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum item encontrado.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => {
            const st = STATUS_LABELS[item.status] || STATUS_LABELS.available
            const isLow = item.quantity <= item.minStock && item.status === 'available'
            return (
              <Card key={item.id} className={isLow ? 'border-yellow-400/50' : ''}>
                <CardContent className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>
                      {item.category && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: item.category.color + '20', color: item.category.color }}>
                          {item.category.name}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${st.cls}`}>{st.label}</span>
                      {isLow && <span className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Baixo</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                      {item.brand && <span>Marca: {item.brand}</span>}
                      {item.model && <span>Modelo: {item.model}</span>}
                      {item.serialNumber && <span>Serial: {item.serialNumber}</span>}
                      {item.location && <span>Local: {item.location}</span>}
                      {item.customer && <span>Cliente: {item.customer.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className={`text-lg font-bold ${isLow ? 'text-yellow-600' : ''}`}>{item.quantity}</p>
                      <p className="text-xs text-muted-foreground">un. (min: {item.minStock})</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {item.unitCost && <p>Custo: {toBRL(item.unitCost)}</p>}
                      {item.unitPrice && <p>Preço: {toBRL(item.unitPrice)}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Movimentar" onClick={() => openMove(item)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog criar/editar item */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Item' : 'Novo Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ONU Huawei HG8310M" /></div>
              <div><Label>Marca</Label><Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Huawei" /></div>
              <div><Label>Modelo</Label><Input value={form.model} onChange={e => set('model', e.target.value)} placeholder="HG8310M" /></div>
              <div><Label>Número de Série</Label><Input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoryId || 'none'} onValueChange={v => set('categoryId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {(categories || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!editing && <div><Label>Quantidade inicial</Label><Input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></div>}
              <div><Label>Estoque mínimo</Label><Input type="number" value={form.minStock} onChange={e => set('minStock', e.target.value)} /></div>
              <div><Label>Custo unitário (R$)</Label><Input type="number" step="0.01" value={form.unitCost} onChange={e => set('unitCost', e.target.value)} /></div>
              <div><Label>Preço venda (R$)</Label><Input type="number" step="0.01" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} /></div>
              <div><Label>Localização</Label><Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Almoxarifado POP-01" /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog movimentação */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Movimentação: {moveItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Saldo atual: <strong>{moveItem?.quantity ?? 0}</strong> unidades</p>
            <div>
              <Label>Tipo</Label>
              <Select value={moveType} onValueChange={setMoveType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Saída</SelectItem>
                  <SelectItem value="install">Instalação</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantidade</Label><Input type="number" min="1" value={moveQty} onChange={e => setMoveQty(e.target.value)} /></div>
            <div><Label>Motivo / Referência</Label><Input value={moveReason} onChange={e => setMoveReason(e.target.value)} placeholder="NF 12345, OS-2026-0001, etc." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMove} disabled={moveSaving}>{moveSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>Todas as movimentações deste item também serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
