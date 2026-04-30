// =============================================================================
// SettingsView - tela de configurações e personalização do provedor
// =============================================================================
// Abas: Empresa (dados, endereço, logo) | Cores | Integrações
//
// Para extender, basta adicionar novos campos em allowed[] no
// /api/settings/route.ts e renderizar o input correspondente abaixo.
// =============================================================================
'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader2, Building2, Palette, Plug, Save, Upload, Image as ImageIcon, X, DollarSign, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useThemeColors } from '@/components/theme-colors-provider'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SettingsView() {
  const { data, isLoading, mutate } = useSWR('/api/settings', fetcher)
  const { refresh } = useThemeColors()
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  useEffect(() => {
    if (data) setForm({
      // Identidade
      companyName: data.companyName ?? 'TitaNet',
      companyDocument: data.companyDocument ?? '',
      companyEmail: data.companyEmail ?? '',
      companyPhone: data.companyPhone ?? '',
      companyWhatsapp: data.companyWhatsapp ?? '',
      companyWebsite: data.companyWebsite ?? '',
      // logoUrl persistido: pode ser URL externa OU cloud_storage_path
      logoUrl: data.logoStoredValue ?? '',
      // logoPreviewUrl: sempre uma URL "pronta para <img>" (signed se interna)
      logoPreviewUrl: data.logoUrl ?? '',
      // Dados fiscais
      companyIE: data.companyIE ?? '',
      companyIM: data.companyIM ?? '',
      // Endereço estruturado
      companyZipCode: data.companyZipCode ?? '',
      companyStreet: data.companyStreet ?? '',
      companyNumber: data.companyNumber ?? '',
      companyComplement: data.companyComplement ?? '',
      companyNeighborhood: data.companyNeighborhood ?? '',
      companyCity: data.companyCity ?? '',
      companyState: data.companyState ?? '',
      companyAddress: data.companyAddress ?? '', // legado
      // Tema
      primaryColor: data.primaryColor ?? '#0066CC',
      secondaryColor: data.secondaryColor ?? '#FFFFFF',
      accentColor: data.accentColor ?? '#003E80',
      // Cobrança
      billingDueDay: data.billingDueDay ?? 10,
      billingGracePeriod: data.billingGracePeriod ?? 5,
      billingInterestRate: data.billingInterestRate ?? '',
      billingFineRate: data.billingFineRate ?? '',
      billingAutoGenerate: data.billingAutoGenerate ?? false,
      billingPixKey: data.billingPixKey ?? '',
      billingBankName: data.billingBankName ?? '',
      billingBankAgency: data.billingBankAgency ?? '',
      billingBankAccount: data.billingBankAccount ?? '',
      billingNotes: data.billingNotes ?? '',
      // Integrações
      receitaApiKey: '', oltApiUrl: data.oltApiUrl ?? '', oltApiToken: '',
      mikrotikApiUrl: data.mikrotikApiUrl ?? '', mikrotikApiUser: data.mikrotikApiUser ?? '', mikrotikApiPassword: '',
      signatureProvider: data.signatureProvider ?? '', signatureApiKey: '',
      smsProvider: data.smsProvider ?? '', smsApiKey: '',
      // Comunicação
      emailProvider: data.emailProvider ?? '',
      smtpHost: data.smtpHost ?? '',
      smtpPort: data.smtpPort ?? 587,
      smtpUser: data.smtpUser ?? '',
      smtpPassword: '',
      smtpFromEmail: data.smtpFromEmail ?? '',
      smtpFromName: data.smtpFromName ?? '',
      whatsappProvider: data.whatsappProvider ?? '',
      whatsappApiUrl: data.whatsappApiUrl ?? '',
      whatsappApiKey: '',
    })
  }, [data])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  // ----- Busca de CEP via ViaCEP (grátis e sem auth) -----
  const handleCepBlur = async () => {
    const cep = (form.companyZipCode ?? '').replace(/\D/g, '')
    if (cep.length !== 8) return
    setCepLoading(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (d?.erro) { toast.error('CEP não encontrado'); return }
      setForm((p: any) => ({
        ...p,
        companyStreet: d.logradouro || p.companyStreet,
        companyNeighborhood: d.bairro || p.companyNeighborhood,
        companyCity: d.localidade || p.companyCity,
        companyState: d.uf || p.companyState,
      }))
      toast.success('Endereço preenchido pelo CEP')
    } catch {
      toast.error('Falha ao consultar CEP')
    } finally { setCepLoading(false) }
  }

  // ----- Upload de logo via /api/uploads (cloud storage S3) -----
  // Salvamos o cloud_storage_path em logoUrl (campo do banco) e
  // exibimos a signed URL (`url`) imediatamente como preview.
  const handleLogoUpload = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return }
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'logos')
      const r = await fetch('/api/uploads', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro no upload'); return }
      // Persistimos o path interno; a URL apresentável vem do GET /api/settings.
      setForm((p: any) => ({ ...p, logoUrl: d.cloud_storage_path, logoPreviewUrl: d.url }))
      toast.success('Logo enviado. Não esqueça de salvar.')
    } catch (err: any) {
      toast.error('Falha ao enviar logo')
    } finally { setLogoUploading(false) }
  }

  const submit = async () => {
    setSaving(true)
    try {
      // Remove campos sensíveis vazios para não sobrescrever
      const payload: any = { ...form }
      ;['receitaApiKey', 'oltApiToken', 'mikrotikApiPassword', 'signatureApiKey', 'smsApiKey'].forEach((k) => {
        if (!payload[k]) delete payload[k]
      })
      // logoPreviewUrl é apenas para UI - não persistir
      delete payload.logoPreviewUrl
      const r = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error ?? 'Erro'); return }
      toast.success('Configurações salvas')
      mutate()
      await refresh()
    } finally { setSaving(false) }
  }

  if (isLoading) return <div className="text-center py-12"><Loader2 className="size-6 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">Personalize o painel do seu provedor.</p>
        </div>
        <Button onClick={submit} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar alterações
        </Button>
      </div>

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding" className="gap-2"><Building2 className="size-4" /> Empresa</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><DollarSign className="size-4" /> Cobrança</TabsTrigger>
          <TabsTrigger value="theme" className="gap-2"><Palette className="size-4" /> Cores</TabsTrigger>
          <TabsTrigger value="communication" className="gap-2"><MessageSquare className="size-4" /> Comunicação</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Plug className="size-4" /> Integrações</TabsTrigger>
        </TabsList>

        {/* ===================== ABA EMPRESA ===================== */}
        <TabsContent value="branding" className="space-y-4">

          {/* Logo / Identidade Visual */}
          <Card>
            <CardHeader><CardTitle className="text-base">Identidade Visual</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="size-32 rounded-md border bg-muted/30 grid place-items-center overflow-hidden relative shrink-0">
                  {(form.logoPreviewUrl || (form.logoUrl?.startsWith('http') && form.logoUrl)) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoPreviewUrl || form.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain"
                      onError={(e: any) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <ImageIcon className="size-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Logo da empresa</Label>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Recomendado: fundo transparente, máx 5MB.</p>
                  <div className="flex flex-wrap gap-2">
                    <input id="logoFile" type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logoFile')?.click()}
                      disabled={logoUploading} className="gap-2">
                      {logoUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      Enviar imagem
                    </Button>
                    {form.logoUrl && (
                      <Button type="button" variant="ghost" size="sm"
                        onClick={() => setForm((p: any) => ({ ...p, logoUrl: '', logoPreviewUrl: '' }))}
                        className="gap-2 text-destructive">
                        <X className="size-4" /> Remover
                      </Button>
                    )}
                  </div>
                  <div className="pt-2">
                    <Label className="text-xs">URL externa (alternativa)</Label>
                    <Input value={form.logoUrl?.startsWith('http') ? form.logoUrl : ''}
                      onChange={(e) => setForm((p: any) => ({ ...p, logoUrl: e.target.value, logoPreviewUrl: e.target.value }))}
                      placeholder="https://www.zilliondesigns.com/blog/wp-content/uploads/logo-guide-1-1280x720.png" className="text-xs" />
                    <p className="text-[11px] text-muted-foreground mt-1">Use se preferir hospedar o logo em outro serviço.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados da Empresa */}
          <Card>
            <CardHeader><CardTitle className="text-base">Dados da Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label>Razão Social / Nome Fantasia</Label><Input value={form.companyName ?? ''} onChange={(e) => set('companyName', e.target.value)} /></div>
                <div><Label>CNPJ / CPF</Label><Input value={form.companyDocument ?? ''} onChange={(e) => set('companyDocument', e.target.value)} placeholder="00.000.000/0000-00" /></div>
                <div><Label>Inscrição Estadual</Label><Input value={form.companyIE ?? ''} onChange={(e) => set('companyIE', e.target.value)} placeholder="Isento ou número" /></div>
                <div><Label>Inscrição Municipal</Label><Input value={form.companyIM ?? ''} onChange={(e) => set('companyIM', e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={form.companyEmail ?? ''} onChange={(e) => set('companyEmail', e.target.value)} placeholder="contato@provedor.com.br" /></div>
                <div><Label>Telefone fixo</Label><Input value={form.companyPhone ?? ''} onChange={(e) => set('companyPhone', e.target.value)} placeholder="(11) 3000-0000" /></div>
                <div><Label>WhatsApp</Label><Input value={form.companyWhatsapp ?? ''} onChange={(e) => set('companyWhatsapp', e.target.value)} placeholder="(11) 99999-0000" /></div>
                <div className="sm:col-span-2"><Label>Site / Portal</Label><Input value={form.companyWebsite ?? ''} onChange={(e) => set('companyWebsite', e.target.value)} placeholder="https://..." /></div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader><CardTitle className="text-base">Endereço da Sede</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input value={form.companyZipCode ?? ''} onChange={(e) => set('companyZipCode', e.target.value)}
                      onBlur={handleCepBlur} placeholder="00000-000" />
                    {cepLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Ao sair do campo o endereço é preenchido automaticamente.</p>
                </div>
                <div className="sm:col-span-3"><Label>Logradouro</Label><Input value={form.companyStreet ?? ''} onChange={(e) => set('companyStreet', e.target.value)} placeholder="Rua / Avenida" /></div>
                <div className="sm:col-span-1"><Label>Número</Label><Input value={form.companyNumber ?? ''} onChange={(e) => set('companyNumber', e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>Complemento</Label><Input value={form.companyComplement ?? ''} onChange={(e) => set('companyComplement', e.target.value)} placeholder="Sala, andar..." /></div>
                <div className="sm:col-span-2"><Label>Bairro</Label><Input value={form.companyNeighborhood ?? ''} onChange={(e) => set('companyNeighborhood', e.target.value)} /></div>
                <div className="sm:col-span-1"><Label>UF</Label><Input value={form.companyState ?? ''} onChange={(e) => set('companyState', e.target.value.toUpperCase().slice(0,2))} maxLength={2} /></div>
                <div className="sm:col-span-3"><Label>Cidade</Label><Input value={form.companyCity ?? ''} onChange={(e) => set('companyCity', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== ABA COBRANÇA ===================== */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Regras de Cobrança</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Dia de vencimento padrão</Label><Input type="number" min={1} max={28} value={form.billingDueDay ?? 10} onChange={(e) => set('billingDueDay', e.target.value)} /><p className="text-[11px] text-muted-foreground mt-1">Dia do mês para vencimento (1-28)</p></div>
                <div><Label>Carência (dias)</Label><Input type="number" min={0} value={form.billingGracePeriod ?? 5} onChange={(e) => set('billingGracePeriod', e.target.value)} /><p className="text-[11px] text-muted-foreground mt-1">Dias após vencimento antes de aplicar juros/multa</p></div>
                <div><Label>Juros diário (%)</Label><Input type="number" step="0.0001" value={form.billingInterestRate ?? ''} onChange={(e) => set('billingInterestRate', e.target.value)} placeholder="0.0333" /><p className="text-[11px] text-muted-foreground mt-1">Ex: 0.0333% ao dia = ~1% ao mês</p></div>
                <div><Label>Multa por atraso (%)</Label><Input type="number" step="0.01" value={form.billingFineRate ?? ''} onChange={(e) => set('billingFineRate', e.target.value)} placeholder="2.00" /><p className="text-[11px] text-muted-foreground mt-1">Percentual aplicado sobre o valor total</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Dados Bancários / PIX</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label>Chave PIX</Label><Input value={form.billingPixKey ?? ''} onChange={(e) => set('billingPixKey', e.target.value)} placeholder="CNPJ, email, telefone ou chave aleatória" /></div>
                <div><Label>Banco</Label><Input value={form.billingBankName ?? ''} onChange={(e) => set('billingBankName', e.target.value)} placeholder="Banco do Brasil, Sicoob..." /></div>
                <div><Label>Agência</Label><Input value={form.billingBankAgency ?? ''} onChange={(e) => set('billingBankAgency', e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>Conta</Label><Input value={form.billingBankAccount ?? ''} onChange={(e) => set('billingBankAccount', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Observações na Fatura</CardTitle></CardHeader>
            <CardContent>
              <Label>Texto padrão</Label>
              <textarea className="mt-1.5 w-full border rounded-md p-2 text-sm min-h-[80px] bg-background"
                value={form.billingNotes ?? ''} onChange={(e) => set('billingNotes', e.target.value)}
                placeholder="Texto que aparecerá no rodapé de todas as faturas..." />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== ABA TEMA ===================== */}
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Cores do Tema</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Personalize as cores do painel. As alterações são aplicadas imediatamente após salvar.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <ColorField label="Cor Primária" value={form.primaryColor ?? '#0066CC'} onChange={(v) => set('primaryColor', v)} />
                <ColorField label="Cor Secundária" value={form.secondaryColor ?? '#FFFFFF'} onChange={(v) => set('secondaryColor', v)} />
                <ColorField label="Cor de Destaque" value={form.accentColor ?? '#003E80'} onChange={(v) => set('accentColor', v)} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { set('primaryColor', '#0066CC'); set('secondaryColor', '#FFFFFF'); set('accentColor', '#003E80') }}>Restaurar Azul Padrão</Button>
                <Button variant="outline" size="sm" onClick={() => { set('primaryColor', '#10B981'); set('accentColor', '#047857') }}>Verde</Button>
                <Button variant="outline" size="sm" onClick={() => { set('primaryColor', '#7C3AED'); set('accentColor', '#5B21B6') }}>Roxo</Button>
                <Button variant="outline" size="sm" onClick={() => { set('primaryColor', '#F97316'); set('accentColor', '#C2410C') }}>Laranja</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== ABA COMUNICAÇÃO ===================== */}
        <TabsContent value="communication" className="space-y-4">
          <Card><CardHeader><CardTitle>E-mail (SMTP)</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.emailProvider ?? ''} onChange={e => set('emailProvider', e.target.value)}>
                  <option value="">Desativado</option>
                  <option value="smtp">SMTP</option>
                  <option value="mock">Mock (teste)</option>
                </select>
              </div>
              <div><Label>Servidor SMTP</Label><Input value={form.smtpHost ?? ''} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" /></div>
              <div><Label>Porta</Label><Input type="number" value={form.smtpPort ?? 587} onChange={e => set('smtpPort', e.target.value)} /></div>
              <div><Label>Usuário</Label><Input value={form.smtpUser ?? ''} onChange={e => set('smtpUser', e.target.value)} placeholder="usuario@provedor.com" /></div>
              <div><Label>Senha {data?.hasSmtpPassword && '(já configurada)'}</Label><Input type="password" value={form.smtpPassword ?? ''} onChange={e => set('smtpPassword', e.target.value)} placeholder="••••••••" /></div>
              <div><Label>E-mail remetente</Label><Input type="email" value={form.smtpFromEmail ?? ''} onChange={e => set('smtpFromEmail', e.target.value)} placeholder="noreply@provedor.com" /></div>
              <div><Label>Nome do remetente</Label><Input value={form.smtpFromName ?? ''} onChange={e => set('smtpFromName', e.target.value)} placeholder="Meu Provedor" /></div>
            </div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>SMS</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Provider SMS</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.smsProvider ?? ''} onChange={e => set('smsProvider', e.target.value)}>
                  <option value="">Desativado</option>
                  <option value="zenvia">Zenvia</option>
                  <option value="twilio">Twilio</option>
                  <option value="mock">Mock (teste)</option>
                </select>
              </div>
              <div><Label>API Key {data?.hasSmsApiKey && '(já configurada)'}</Label><Input type="password" value={form.smsApiKey ?? ''} onChange={e => set('smsApiKey', e.target.value)} placeholder="••••••••" /></div>
            </div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Provider WhatsApp</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.whatsappProvider ?? ''} onChange={e => set('whatsappProvider', e.target.value)}>
                  <option value="">Desativado</option>
                  <option value="evolution">Evolution API</option>
                  <option value="z-api">Z-API</option>
                  <option value="mock">Mock (teste)</option>
                </select>
              </div>
              <div><Label>URL da API</Label><Input value={form.whatsappApiUrl ?? ''} onChange={e => set('whatsappApiUrl', e.target.value)} placeholder="https://api.evolution..." /></div>
              <div><Label>API Key {data?.hasWhatsappApiKey && '(já configurada)'}</Label><Input type="password" value={form.whatsappApiKey ?? ''} onChange={e => set('whatsappApiKey', e.target.value)} placeholder="••••••••" /></div>
            </div>
          </CardContent></Card>

          <p className="text-xs text-muted-foreground">
            Configure os provedores de mensageria. O envio real será habilitado quando os providers estiverem configurados. Enquanto isso, o sistema opera em modo simulado (mock).
          </p>
        </TabsContent>

        {/* ===================== ABA INTEGRAÇÕES ===================== */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Receita Federal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Chave de API para consultar CPF/CNPJ. Atualmente em modo simulado.</p>
              <div><Label>API Key</Label><Input type="password" placeholder={data?.hasReceitaApiKey ? '•••••• (salva)' : 'Cole a chave aqui'} value={form.receitaApiKey ?? ''} onChange={(e) => set('receitaApiKey', e.target.value)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">SMS</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div><Label>Provedor</Label><Input value={form.smsProvider ?? ''} onChange={(e) => set('smsProvider', e.target.value)} placeholder="twilio | totalvoice | outro" /></div>
              <div><Label>API Key</Label><Input type="password" placeholder={data?.hasSmsApiKey ? '•••••• (salva)' : ''} value={form.smsApiKey ?? ''} onChange={(e) => set('smsApiKey', e.target.value)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">OLT (Sinal ONU)</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div><Label>URL da API</Label><Input value={form.oltApiUrl ?? ''} onChange={(e) => set('oltApiUrl', e.target.value)} placeholder="https://olt.exemplo.com" /></div>
              <div><Label>Token</Label><Input type="password" placeholder={data?.hasOltToken ? '•••••• (salvo)' : 'Cole o token'} value={form.oltApiToken ?? ''} onChange={(e) => set('oltApiToken', e.target.value)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">MikroTik</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-3">
              <div><Label>URL/Host</Label><Input value={form.mikrotikApiUrl ?? ''} onChange={(e) => set('mikrotikApiUrl', e.target.value)} placeholder="192.168.88.1" /></div>
              <div><Label>Usuário</Label><Input value={form.mikrotikApiUser ?? ''} onChange={(e) => set('mikrotikApiUser', e.target.value)} /></div>
              <div><Label>Senha</Label><Input type="password" placeholder={data?.hasMikrotikPassword ? '•••••• (salva)' : ''} value={form.mikrotikApiPassword ?? ''} onChange={(e) => set('mikrotikApiPassword', e.target.value)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Assinatura Digital</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div><Label>Provedor</Label><Input value={form.signatureProvider ?? ''} onChange={(e) => set('signatureProvider', e.target.value)} placeholder="clicksign | docusign | autentique" /></div>
              <div><Label>API Key</Label><Input type="password" placeholder={data?.hasSignatureKey ? '•••••• (salva)' : ''} value={form.signatureApiKey ?? ''} onChange={(e) => set('signatureApiKey', e.target.value)} /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-10 rounded-md cursor-pointer bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono" />
      </div>
    </div>
  )
}