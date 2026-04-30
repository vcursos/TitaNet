// =============================================================================
// GenericFormDialog - dialog genérico para criar/editar registros
// =============================================================================
// Aceita um array de FieldDef e gera um formulário dinâmico que faz
// POST/PATCH para o endpoint informado. Suporta texto, número, select,
// switch, textarea, password e select-async (busca em outro endpoint).
// =============================================================================
'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export type FieldDef = {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'password' | 'number' | 'textarea' | 'switch' | 'select' | 'select-async'
  placeholder?: string
  required?: boolean
  defaultValue?: any
  colSpan?: 1 | 2 | 3   // span dentro de grid de 3 colunas
  options?: { value: string; label: string }[]
  asyncEndpoint?: string
  asyncMap?: (item: any) => { value: string; label: string }
  step?: string
  helper?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  endpoint: string
  record: any | null
  fields: FieldDef[]
  onSaved: () => void
}

export function GenericFormDialog({
  open, onOpenChange, title, endpoint, record, fields, onSaved,
}: Props) {
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const isEdit = !!record

  useEffect(() => {
    if (!open) return
    const initial: any = {}
    for (const f of fields) {
      if (record && f.name in record) initial[f.name] = record[f.name] ?? ''
      else initial[f.name] = f.defaultValue ?? (f.type === 'switch' ? true : '')
    }
    setForm(initial)
  }, [open, record, fields])

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const submit = async () => {
    setSaving(true)
    try {
      // Required validation
      for (const f of fields) {
        if (f.required && (form[f.name] == null || form[f.name] === '')) {
          toast.error(`Campo "${f.label}" é obrigatório`)
          setSaving(false); return
        }
      }
      const url = isEdit ? `${endpoint}/${record.id}` : endpoint
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { toast.error(d?.error ?? 'Erro ao salvar'); return }
      toast.success(isEdit ? 'Atualizado' : 'Criado com sucesso')
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fields.map((f) => (
            <FieldRenderer key={f.name} field={f} value={form[f.name]} onChange={(v) => set(f.name, v)} />
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FieldRenderer({
  field, value, onChange,
}: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const span = field.colSpan ?? 1
  const cls = span === 3 ? 'sm:col-span-3' : span === 2 ? 'sm:col-span-2' : ''

  if (field.type === 'switch') {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${cls}`}>
        <div>
          <Label className="font-medium">{field.label}</Label>
          {field.helper && <p className="text-xs text-muted-foreground">{field.helper}</p>}
        </div>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className={cls || 'sm:col-span-3'}>
        <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
        <Textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} />
        {field.helper && <p className="text-[11px] text-muted-foreground mt-1">{field.helper}</p>}
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div className={cls}>
        <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
        <Select value={value ? String(value) : ''} onValueChange={(v) => onChange(v)}>
          <SelectTrigger><SelectValue placeholder={field.placeholder ?? 'Selecione'} /></SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (field.type === 'select-async') {
    return <AsyncSelectField field={field} value={value} onChange={onChange} cls={cls} />
  }

  return (
    <div className={cls}>
      <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
      <Input
        type={field.type}
        value={value ?? ''}
        onChange={(e) => onChange(
          field.type === 'number' && e.target.value !== ''
            ? Number(e.target.value)
            : e.target.value
        )}
        placeholder={field.placeholder}
        step={field.step}
      />
      {field.helper && <p className="text-[11px] text-muted-foreground mt-1">{field.helper}</p>}
    </div>
  )
}

function AsyncSelectField({
  field, value, onChange, cls,
}: { field: FieldDef; value: any; onChange: (v: any) => void; cls: string }) {
  const { data } = useSWR(field.asyncEndpoint!, fetcher)
  const items = (data ?? []).map(field.asyncMap ?? ((i: any) => ({ value: i.id, label: i.name })))
  return (
    <div className={cls}>
      <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
      <Select value={value ? String(value) : ''} onValueChange={(v) => onChange(v === '__none__' ? null : v)}>
        <SelectTrigger><SelectValue placeholder={field.placeholder ?? 'Selecione'} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Nenhum</SelectItem>
          {items.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
