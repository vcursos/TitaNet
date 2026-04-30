// =============================================================================
// TemplatesView - CRUD de modelos de mensagem
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Plus, Search, Loader2, Pencil, Trash2, FileText, Mail, MessageSquare, Phone,
  Copy, Eye, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { AVAILABLE_PLACEHOLDERS } from '@/lib/message-renderer'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CHANNELS = [
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'sms', label: 'SMS', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
]

const EVENTS = [
  { value: '', label: 'Nenhum (manual)' },
  { value: 'invoice_created', label: 'Fatura gerada' },
  { value: 'invoice_due_soon', label: 'Fatura próxima do vencimento' },
  { value: 'invoice_overdue', label: 'Fatura vencida' },
  { value: 'welcome', label: 'Boas-vindas' },
  { value: 'disconnection', label: 'Aviso de suspensão' },
  { value: 'custom', label: 'Personalizado' },
]

function channelIcon(ch: string) {
  const C = CHANNELS.find(c => c.value === ch)
  return C ? <C.icon className="h-4 w-4" /> : <Mail className="h-4 w-4" />
}

function channelLabel(ch: string) {
  return CHANNELS.find(c => c.value === ch)?.label || ch
}

const EMPTY_FORM = {
  name: '', slug: '', channel: 'email', subject: '', body: '', event: '', active: true,
}

export function TemplatesView() {
  const [filter, setFilter] = useState('all')
  const { data: templates, isLoading, mutate } = useSWR(
    `/api/communication/templates${filter !== 'all' ? `?channel=${filter}` : ''}`,
    fetcher,
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBody, setPreviewBody] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }
  function openEdit(t: any) {
    setEditing(t)
    setForm({
      name: t.name || '',
      slug: t.slug || '',
      channel: t.channel || 'email',
      subject: t.subject || '',
      body: t.body || '',
      event: t.event || '',
      active: t.active !== false,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.slug || !form.body) {
      toast.error('Preencha nome, slug e corpo')
      return
    }
    setSaving(true)
    try {
      const url = editing
        ? `/api/communication/templates/${editing.id}`
        : '/api/communication/templates'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }
      toast.success(editing ? 'Template atualizado' : 'Template criado')
      setDialogOpen(false)
      mutate()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/communication/templates/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Template excluído')
      mutate()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleteId(null)
    }
  }

  function insertPlaceholder(key: string) {
    setForm(prev => ({ ...prev, body: prev.body + `{{${key}}}` }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Modelos de Mensagem</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie templates para envio de e-mail, SMS e WhatsApp</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Template</Button>
      </div>

      {/* Filtro por canal */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: 'all', label: 'Todos' }, ...CHANNELS].map(ch => (
          <Button
            key={ch.value}
            variant={filter === ch.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(ch.value)}
          >
            {ch.value !== 'all' && channelIcon(ch.value)}
            <span className="ml-1">{ch.label}</span>
          </Button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !templates?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum template cadastrado.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t: any) => (
            <Card key={t.id} className={!t.active ? 'opacity-60' : ''}>
              <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {channelIcon(t.channel)}
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{t.slug}</span>
                    {!t.active && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Inativo</span>}
                    {t.event && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{EVENTS.find(e => e.value === t.event)?.label || t.event}</span>}
                  </div>
                  {t.subject && <p className="text-sm text-muted-foreground mt-1">Assunto: {t.subject}</p>}
                  <p className="text-sm text-muted-foreground mt-1 truncate">{t.body?.substring(0, 120)}...</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" title="Visualizar" onClick={() => { setPreviewBody(t.body || ''); setPreviewOpen(true) }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteId(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lembrete de Vencimento" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="billing_reminder" disabled={!!editing} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(ch => <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Evento</Label>
                <Select value={form.event || 'none'} onValueChange={v => setForm(f => ({ ...f, event: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (manual)</SelectItem>
                    {EVENTS.filter(e => e.value).map(ev => <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.channel === 'email' && (
              <div>
                <Label>Assunto</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Fatura {{invoice_number}} - Vencimento {{invoice_due_date}}" />
              </div>
            )}
            <div>
              <Label>Corpo da mensagem *</Label>
              <Textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={8}
                placeholder="Olá {{customer_name}}, sua fatura no valor de {{invoice_amount}} vence em {{invoice_due_date}}..."
              />
            </div>
            {/* Placeholders disponíveis */}
            <div>
              <Label className="text-sm text-muted-foreground">Variáveis disponíveis (clique para inserir)</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {AVAILABLE_PLACEHOLDERS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded transition-colors"
                    onClick={() => insertPlaceholder(p.key)}
                    title={p.label}
                  >
                    {`{{${p.key}}}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview do corpo */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Pré-visualização</DialogTitle></DialogHeader>
          <div className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap text-sm">{previewBody}</div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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
