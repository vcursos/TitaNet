// =============================================================================
// InvoicesView - listagem de faturas com filtros, geração em lote e baixa
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import {
  Plus, Search, Receipt, Loader2, Pencil, Trash2, Download, CreditCard,
  Calendar, Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { toast } from 'sonner'
import { formatBRL } from '@/lib/format'

const STATUSES = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { value: 'paid', label: 'Paga', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  { value: 'overdue', label: 'Vencida', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  { value: 'partially_paid', label: 'Parcial', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400' },
]

const METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'card', label: 'Cartão' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'other', label: 'Outro' },
]

const statusInfo = (v: string) => STATUSES.find((s) => s.value === v) ?? { label: v, color: 'bg-muted text-muted-foreground' }
const methodLabel = (v: string) => METHODS.find((m) => m.value === v)?.label ?? v

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Mês atual no formato YYYY-MM
function currentMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function InvoicesView() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (monthFilter) params.set('month', monthFilter)
  const url = `/api/finance/invoices${params.toString() ? `?${params}` : ''}`
  const { data, isLoading } = useSWR<any[]>(url, fetcher)

  const [showGenerate, setShowGenerate] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState<any>(null)
  const [deleting, setDeleting] = useState<any>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const refresh = () => globalMutate(url)

  const confirmDelete = async () => {
    if (!deleting) return
    setDeletingLoading(true)
    try {
      const r = await fetch(`/api/finance/invoices/${deleting.id}`, { method: 'DELETE' })
      if (!r.ok) { toast.error('Erro ao excluir'); return }
      toast.success('Fatura excluída'); setDeleting(null); refresh()
    } finally { setDeletingLoading(false) }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            Faturas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as faturas mensais dos clientes.
          </p>
        </div>
        <Button onClick={() => setShowGenerate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Gerar faturas do mês
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número ou cliente..." className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full md:w-44" />
          </div>
        </CardContent>
      </Card>

      {/* Listagem */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma fatura encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Número</th>
                    <th className="px-4 py-3 text-left font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium">Referência</th>
                    <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium w-32">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((inv: any) => {
                    const sInfo = statusInfo(inv.status)
                    return (
                      <tr key={inv.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{inv.number}</td>
                        <td className="px-4 py-3">{inv.customer?.name ?? '-'}</td>
                        <td className="px-4 py-3 text-xs">{inv.referenceMonth}</td>
                        <td className="px-4 py-3 text-xs">
                          {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatBRL(Number(inv.totalAmount))}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sInfo.color}`}>
                            {sInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {(inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partially_paid') && (
                              <Button variant="ghost" size="icon" title="Registrar pagamento"
                                onClick={() => setPayingInvoice(inv)} className="h-8 w-8 text-green-600">
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setDeleting(inv)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
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

      {/* Dialog de geração em lote */}
      <GenerateDialog open={showGenerate} onOpenChange={setShowGenerate} onDone={refresh} />

      {/* Dialog de baixa (pagamento) */}
      <PaymentDialog invoice={payingInvoice} onOpenChange={() => setPayingInvoice(null)} onDone={refresh} />

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fatura {deleting?.number}?</AlertDialogTitle>
            <AlertDialogDescription>Fatura e pagamentos vinculados serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletingLoading} className="bg-red-600 hover:bg-red-700">
              {deletingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// =============================================================================
// Dialog de geração em lote
// =============================================================================
function GenerateDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [month, setMonth] = useState(currentMonthStr())
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!month) { toast.error('Selecione o mês'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/finance/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceMonth: month }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success(d.message || `${d.generated} fatura(s) gerada(s)`)
      onOpenChange(false); onDone()
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Gerar Faturas do Mês</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Gera automaticamente uma fatura para cada cliente ativo com plano vinculado que ainda não possui fatura neste mês.
        </p>
        <div className="space-y-1.5">
          <Label>Mês de referência</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={generate} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Gerar faturas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Dialog de registro de pagamento (baixa)
// =============================================================================
function PaymentDialog({ invoice, onOpenChange, onDone }: { invoice: any; onOpenChange: () => void; onDone: () => void }) {
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const open = !!invoice
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  // Inicializar com dados da fatura
  const remainingStr = open ? formatBRL(Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount ?? 0))) : ''
  const remaining = open ? Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount ?? 0)) : 0

  const submit = async () => {
    const amount = Number(form.amount ?? remaining)
    if (amount <= 0) { toast.error('Valor inválido'); return }
    setSaving(true)
    try {
      const r = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount,
          paymentMethod: form.paymentMethod || 'pix',
          paymentDate: form.paymentDate || new Date().toISOString(),
          reference: form.reference || null,
        }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success('Pagamento registrado com sucesso')
      onOpenChange(); onDone()
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        {open && (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fatura</span>
                <span className="font-mono font-medium">{invoice.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span>{invoice.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor total</span>
                <span className="font-medium">{formatBRL(Number(invoice.totalAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Restante</span>
                <span className="font-medium text-amber-600">{remainingStr}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Valor pago (R$)</Label>
              <Input type="number" step="0.01" placeholder={String(remaining)}
                value={form.amount ?? ''} onChange={(e) => set('amount', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={form.paymentMethod || 'pix'} onValueChange={(v) => set('paymentMethod', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data do pagamento</Label>
              <Input type="date" value={form.paymentDate || new Date().toISOString().slice(0, 10)}
                onChange={(e) => set('paymentDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Comprovante / Referência</Label>
              <Input value={form.reference ?? ''} onChange={(e) => set('reference', e.target.value)}
                placeholder="Nº transação, protocolo..." />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onOpenChange} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
