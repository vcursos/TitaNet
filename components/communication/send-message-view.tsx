// =============================================================================
// SendMessageView - envio de mensagens individual/lote
// =============================================================================
'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import {
  Send, Search, Loader2, Mail, MessageSquare, Phone,
  Users, CheckCircle2, XCircle, User, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CHANNELS = [
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'sms', label: 'SMS', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
]

interface SelectedCustomer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

export function SendMessageView() {
  const { data: templates } = useSWR('/api/communication/templates', fetcher)

  const [channel, setChannel] = useState('email')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Customer search
  const [custSearch, setCustSearch] = useState('')
  const [custResults, setCustResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Bulk select
  const [bulkFilter, setBulkFilter] = useState('')

  // Auto-preencher ao selecionar template
  useEffect(() => {
    if (templateId && templates) {
      const tpl = templates.find((t: any) => t.id === templateId)
      if (tpl) {
        setChannel(tpl.channel)
        setSubject(tpl.subject || '')
        setMessageBody(tpl.body || '')
      }
    }
  }, [templateId, templates])

  // Buscar clientes
  useEffect(() => {
    if (custSearch.length < 2) { setCustResults([]); return }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(custSearch)}`)
        if (res.ok) {
          const data = await res.json()
          setCustResults(data)
          setShowDropdown(true)
        }
      } finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [custSearch])

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addCustomer(c: any) {
    if (!selectedCustomers.find(sc => sc.id === c.id)) {
      setSelectedCustomers(prev => [...prev, { id: c.id, name: c.name, email: c.email, phone: c.phone }])
    }
    setCustSearch('')
    setShowDropdown(false)
  }

  function removeCustomer(id: string) {
    setSelectedCustomers(prev => prev.filter(c => c.id !== id))
  }

  async function loadBulk() {
    try {
      const url = bulkFilter
        ? `/api/customers?status=${bulkFilter}`
        : '/api/customers'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erro ao buscar')
      const data = await res.json()
      const newCustomers: SelectedCustomer[] = data.map((c: any) => ({
        id: c.id, name: c.name, email: c.email, phone: c.phone,
      }))
      setSelectedCustomers(newCustomers)
      toast.success(`${newCustomers.length} clientes selecionados`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function handleSend() {
    if (!selectedCustomers.length) {
      toast.error('Selecione ao menos um cliente')
      return
    }
    if (!templateId && !messageBody) {
      toast.error('Selecione um template ou digite a mensagem')
      return
    }
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/communication/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: templateId || undefined,
          customerIds: selectedCustomers.map(c => c.id),
          channel,
          subject: channel === 'email' ? subject : undefined,
          messageBody: !templateId ? messageBody : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      setResult(data)
      toast.success(`Enviado: ${data.sent} | Falhas: ${data.failed}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  const activeTemplates = templates?.filter((t: any) => t.active && t.channel === channel) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enviar Mensagem</h1>
        <p className="text-muted-foreground text-sm mt-1">Envie mensagens individuais ou em lote para seus clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda - configuração */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Mensagem</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Canal */}
              <div className="flex gap-2">
                {CHANNELS.map(ch => (
                  <Button
                    key={ch.value}
                    variant={channel === ch.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setChannel(ch.value); setTemplateId('') }}
                  >
                    <ch.icon className="h-4 w-4 mr-1" />{ch.label}
                  </Button>
                ))}
              </div>

              {/* Template */}
              <div>
                <Label>Template (opcional)</Label>
                <Select value={templateId || 'none'} onValueChange={v => setTemplateId(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Mensagem personalizada</SelectItem>
                    {activeTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assunto (email) */}
              {channel === 'email' && (
                <div>
                  <Label>Assunto</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto do e-mail" />
                </div>
              )}

              {/* Corpo */}
              <div>
                <Label>Corpo da mensagem</Label>
                <Textarea
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  rows={6}
                  placeholder="Olá {{customer_name}}, ..."
                />
                <p className="text-xs text-muted-foreground mt-1">Use {`{{customer_name}}`}, {`{{invoice_amount}}`}, etc. para personalizar.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita - destinatários */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Destinatários ({selectedCustomers.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* Busca individual */}
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={custSearch}
                    onChange={e => setCustSearch(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="pl-9"
                  />
                  {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                </div>
                {showDropdown && custResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {custResults.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                        onClick={() => addCustomer(c)}
                      >
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Seleção em lote */}
              <div className="flex gap-2">
                <Select value={bulkFilter || 'all'} onValueChange={v => setBulkFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="overdue">Inadimplentes</SelectItem>
                    <SelectItem value="suspended">Suspensos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadBulk}>
                  <Users className="h-4 w-4 mr-1" />Carregar
                </Button>
              </div>

              {/* Lista de selecionados */}
              {selectedCustomers.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selectedCustomers.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 text-sm">
                      <span className="truncate">{c.name}</span>
                      <button type="button" onClick={() => removeCustomer(c.id)} className="shrink-0 ml-1">
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {selectedCustomers.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setSelectedCustomers([])}>
                  Limpar seleção
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Botão de envio */}
          <Button onClick={handleSend} disabled={sending} className="w-full" size="lg">
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar {selectedCustomers.length > 1 ? `para ${selectedCustomers.length} clientes` : ''}
          </Button>

          {/* Resultado */}
          {result && (
            <Card>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Enviados: <strong>{result.sent}</strong></span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>Falhas: <strong>{result.failed}</strong></span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
