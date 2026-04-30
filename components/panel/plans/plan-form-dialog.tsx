'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
  plan?: any
}

const empty = { name: '', description: '', downloadMbps: '', uploadMbps: '', price: '', active: true }

export function PlanFormDialog({ open, onOpenChange, onSaved, plan }: Props) {
  const isEdit = !!plan?.id
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(plan ? {
        name: plan.name ?? '',
        description: plan.description ?? '',
        downloadMbps: plan.downloadMbps?.toString() ?? '',
        uploadMbps: plan.uploadMbps?.toString() ?? '',
        price: plan.price?.toString() ?? '',
        active: plan.active !== false,
      } : empty)
    }
  }, [open, plan])

  const submit = async () => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/plans/${plan.id}` : '/api/plans'
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success(isEdit ? 'Plano atualizado' : 'Plano criado')
      onSaved()
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do plano *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Fibra 300MB" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Download (Mbps)</Label>
              <Input type="number" value={form.downloadMbps} onChange={(e) => setForm({ ...form, downloadMbps: e.target.value })} />
            </div>
            <div>
              <Label>Upload (Mbps)</Label>
              <Input type="number" value={form.uploadMbps} onChange={(e) => setForm({ ...form, uploadMbps: e.target.value })} />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="font-medium">Plano ativo</Label>
              <p className="text-xs text-muted-foreground">Inativos não aparecem para seleção em novos clientes.</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
