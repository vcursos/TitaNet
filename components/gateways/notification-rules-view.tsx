// =============================================================================
// NotificationRulesView - Regras de notificação automática
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Bell, Plus, Search, Loader2, Pencil, Trash2, ToggleLeft, ToggleRight,
  Mail, MessageSquare, Phone, Clock, Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const EVENTS = [
  { value: 'invoice_due_reminder', label: 'Lembrete de Vencimento', desc: 'Antes da fatura vencer' },
  { value: 'invoice_overdue', label: 'Fatura Vencida', desc: 'Após vencimento da fatura' },
  { value: 'customer_welcome', label: 'Boas-vindas', desc: 'Ao cadastrar novo cliente' },
  { value: 'order_created', label: 'OS Criada', desc: 'Ao abrir ordem de serviço' },
  { value: 'order_completed', label: 'OS Concluída', desc: 'Ao finalizar ordem de serviço' },
  { value: 'payment_confirmed', label: 'Pagamento Confirmado', desc: 'Ao confirmar pagamento' },
  { value: 'custom', label: 'Personalizado', desc: 'Evento customizado' },
]

const CHANNELS = [
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'sms', label: 'SMS', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
]

const emptyForm = {
  name: '', event: 'invoice_due_reminder', channel: 'email',
  templateId: '', daysOffset: '0', subject: '', body: '',
}

export function NotificationRulesView() {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: rules, isLoading, mutate } = useSWR('/api/gateways/notification-rules', fetcher)
  const { data: templates } = useSWR('/api/communication/templates', fetcher)

  const templateList = Array.isArray(templates) ? templates : (templates?.templates || [])

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(rule: any) {
    setForm({
      name: rule.name || '',
      event: rule.event || 'custom',
      channel: rule.channel || 'email',
      templateId: rule.templateId || '',
      daysOffset: String(rule.daysOffset ?? 0),
      subject: rule.subject || '',
      body: rule.body || '',
    })
    setEditingId(rule.id)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setSaving(true)
    try {
      const url = editingId
        ? `/api/gateways/notification-rules/${editingId}`
        : '/api/gateways/notification-rules'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          templateId: form.templateId || null,
          daysOffset: parseInt(form.daysOffset) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }
      toast.success(editingId ? 'Regra atualizada!' : 'Regra criada!')
      setDialogOpen(false)
      mutate()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(rule: any) {
    try {
      await fetch(`/api/gateways/notification-rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !rule.active }),
      })
      mutate()
      toast.success(rule.active ? 'Regra desativada' : 'Regra ativada')
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/gateways/notification-rules/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Regra excluída')
      mutate()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteId(null)
    }
  }

  const eventLabel = (ev: string) => EVENTS.find(e => e.value === ev)?.label || ev
  const channelInfo = (ch: string) => CHANNELS.find(c => c.value === ch) || CHANNELS[0]
  const offsetLabel = (days: number) => {
    if (days < 0) return `${Math.abs(days)} dia(s) antes`
    if (days > 0) return `${days} dia(s) depois`
    return 'No mesmo dia'
  }

  const rulesList = Array.isArray(rules) ? rules : []

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notificações Automáticas</h2>
          <p className="text-sm text-muted-foreground">Configure regras para envio automático de notificações</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nova Regra
        </Button>
      </div>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300">Como funciona</p>
            <p className="text-blue-700 dark:text-blue-400">
              Crie regras vinculadas a eventos do sistema. Quando o evento ocorrer, a notificação será enviada automaticamente pelo canal configurado.
              O campo &quot;Offset (dias)&quot; permite antecipar ou atrasar o envio em relação ao evento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : rulesList.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma regra configurada</p>
            <p className="text-sm">Clique em &quot;Nova Regra&quot; para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rulesList.map((rule: any) => {
            const ch = channelInfo(rule.channel)
            const ChIcon = ch.icon
            return (
              <Card key={rule.id} className={`transition-all ${!rule.active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Canal */}
                    <div className={`p-2 rounded-lg ${
                      rule.channel === 'email' ? 'bg-blue-50 text-blue-700' :
                      rule.channel === 'whatsapp' ? 'bg-green-50 text-green-700' :
                      'bg-purple-50 text-purple-700'
                    }`}>
                      <ChIcon className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-medium">{rule.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                          <Zap className="h-3 w-3" /> {eventLabel(rule.event)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" /> {offsetLabel(rule.daysOffset)}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {ch.label}
                        </span>
                        {rule.template && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            Template: {rule.template.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(rule)} title={rule.active ? 'Desativar' : 'Ativar'}>
                        {rule.active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(rule.id)}>
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

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Regra' : 'Nova Regra de Notificação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Lembrete 3 dias antes do vencimento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Evento *</Label>
                <Select value={form.event} onValueChange={(v) => setForm(f => ({ ...f, event: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENTS.map(ev => (
                      <SelectItem key={ev.value} value={ev.value}>
                        <div>
                          <p>{ev.label}</p>
                          <p className="text-xs text-muted-foreground">{ev.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(ch => (
                      <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Offset (dias)</Label>
              <Input
                type="number"
                value={form.daysOffset}
                onChange={(e) => setForm(f => ({ ...f, daysOffset: e.target.value }))}
                placeholder="-3 (antes), 0 (no dia), 5 (depois)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Negativo = antes do evento, positivo = depois. Ex: -3 para lembrete 3 dias antes.
              </p>
            </div>

            <div>
              <Label>Template (opcional)</Label>
              <Select value={form.templateId || 'none'} onValueChange={(v) => setForm(f => ({ ...f, templateId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (usar mensagem abaixo)</SelectItem>
                  {templateList.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.channel})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!form.templateId && (
              <>
                <div>
                  <Label>Assunto</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Lembrete: sua fatura vence em breve"
                  />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={form.body}
                    onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Olá {{customer_name}}, sua fatura de {{invoice_amount}} vence em {{invoice_due_date}}..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variáveis: {'{{customer_name}}'}, {'{{invoice_amount}}'}, {'{{invoice_due_date}}'}, {'{{company_name}}'}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Criar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
