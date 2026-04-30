'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
  customer?: any
}

const empty = {
  name: '', document: '', email: '', phone: '',
  zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  planId: '', monthlyPrice: '', status: 'active',
  network: '', serverHost: '', equipment: '', equipmentMac: '', pppoeUser: '', ipAddress: '',
  notes: '',
}

export function CustomerFormDialog({ open, onOpenChange, onSaved, customer }: Props) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const { data: plans } = useSWR(open ? '/api/plans' : null, fetcher)

  useEffect(() => {
    if (open) {
      if (customer) {
        setForm({
          ...empty,
          ...customer,
          monthlyPrice: customer.monthlyPrice?.toString() ?? '',
          planId: customer.planId ?? '',
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          zipCode: customer.zipCode ?? '',
          street: customer.street ?? '',
          number: customer.number ?? '',
          complement: customer.complement ?? '',
          neighborhood: customer.neighborhood ?? '',
          city: customer.city ?? '',
          state: customer.state ?? '',
          network: customer.network ?? '',
          serverHost: customer.serverHost ?? '',
          equipment: customer.equipment ?? '',
          equipmentMac: customer.equipmentMac ?? '',
          pppoeUser: customer.pppoeUser ?? '',
          ipAddress: customer.ipAddress ?? '',
          notes: customer.notes ?? '',
        })
      } else {
        setForm(empty)
      }
    }
  }, [open, customer])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  // Auto-preencher endereço pelo CEP via ViaCEP (serviço público/gratíisaaa)
  const lookupCep = async () => {
    const cep = (form.zipCode ?? '').replace(/\D/g, '')
    if (cep.length !== 8) {
      toast.error('Informe um CEP válido (8 dígitos)')
      return
    }
    setCepLoading(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (d?.erro) { toast.error('CEP não encontrado'); return }
      setForm((f: any) => ({
        ...f,
        street: d.logradouro ?? f.street,
        neighborhood: d.bairro ?? f.neighborhood,
        city: d.localidade ?? f.city,
        state: d.uf ?? f.state,
      }))
      toast.success('Endereço preenchido pelo CEP')
    } catch {
      toast.error('Erro ao consultar CEP')
    } finally {
      setCepLoading(false)
    }
  }

  const submit = async () => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/customers/${customer.id}` : '/api/customers'
      const method = isEdit ? 'PATCH' : 'POST'
      const payload: any = { ...form }
      // Converter strings vazias em null
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      // Selects de plano
      if (payload.planId === null || payload.planId === 'NONE') payload.planId = null

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao salvar')
        return
      }
      toast.success(isEdit ? 'Cliente atualizado' : 'Cliente cadastrado')
      onSaved()
    } catch {
      toast.error('Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h4 className="text-sm font-semibold mb-3">Dados Pessoais</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Nome / Razão Social *</Label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div>
                <Label>CPF / CNPJ *</Label>
                <Input value={form.document} onChange={(e) => set('document', e.target.value)} placeholder="000.000.000-00" required />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="sm:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="cliente@email.com" />
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold mb-3">Endereço</h4>
            <div className="grid sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <Label>CEP</Label>
                <div className="flex gap-2">
                  <Input value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} placeholder="00000-000" />
                  <Button type="button" variant="outline" size="icon" onClick={lookupCep} disabled={cepLoading}>
                    {cepLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  </Button>
                </div>
              </div>
              <div className="sm:col-span-3">
                <Label>Rua</Label>
                <Input value={form.street} onChange={(e) => set('street', e.target.value)} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.number} onChange={(e) => set('number', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Complemento</Label>
                <Input value={form.complement} onChange={(e) => set('complement', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Bairro</Label>
                <Input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <Label>UF</Label>
                <Input value={form.state} maxLength={2} onChange={(e) => set('state', e.target.value.toUpperCase())} />
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold mb-3">Plano e Status</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Plano</Label>
                <Select value={form.planId || 'NONE'} onValueChange={(v) => set('planId', v === 'NONE' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sem plano</SelectItem>
                    {(plans ?? []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.downloadMbps}MB)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mensalidade (R$)</Label>
                <Input type="number" step="0.01" value={form.monthlyPrice} onChange={(e) => set('monthlyPrice', e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="overdue">Inadimplente</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold mb-3">Infraestrutura de Rede</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Rede / PON</Label>
                <Input value={form.network} onChange={(e) => set('network', e.target.value)} placeholder="PON-01" />
              </div>
              <div>
                <Label>Servidor / Roteador</Label>
                <Input value={form.serverHost} onChange={(e) => set('serverHost', e.target.value)} placeholder="MK-CENTRAL-01" />
              </div>
              <div>
                <Label>Equipamento (ONU/Modelo)</Label>
                <Input value={form.equipment} onChange={(e) => set('equipment', e.target.value)} placeholder="Huawei HG8546M" />
              </div>
              <div>
                <Label>MAC do Equipamento</Label>
                <Input value={form.equipmentMac} onChange={(e) => set('equipmentMac', e.target.value)} placeholder="00:11:22:33:44:55" />
              </div>
              <div>
                <Label>Usuário PPPoE</Label>
                <Input value={form.pppoeUser} onChange={(e) => set('pppoeUser', e.target.value)} />
              </div>
              <div>
                <Label>IP atribuído</Label>
                <Input value={form.ipAddress} onChange={(e) => set('ipAddress', e.target.value)} placeholder="10.10.0.123" />
              </div>
            </div>
          </section>

          <section>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
