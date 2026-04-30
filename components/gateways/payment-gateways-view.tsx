// =============================================================================
// PaymentGatewaysView - Links de pagamento PIX/Boleto gerados
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  QrCode, Search, Loader2, Copy, ExternalLink, Trash2,
  CreditCard, CheckCircle2, Clock, XCircle, FileText, Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pendente',  color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  paid:      { label: 'Pago',      color: 'text-green-600 bg-green-50',   icon: CheckCircle2 },
  expired:   { label: 'Expirado',  color: 'text-red-600 bg-red-50',       icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'text-gray-500 bg-gray-50',     icon: XCircle },
}

const TYPE_MAP: Record<string, { label: string; icon: any }> = {
  pix:    { label: 'PIX', icon: QrCode },
  boleto: { label: 'Boleto', icon: FileText },
}

export function PaymentGatewaysView() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  // Dialog para gerar novo link
  const [genOpen, setGenOpen] = useState(false)
  const [genInvoiceNum, setGenInvoiceNum] = useState('')
  const [genType, setGenType] = useState('pix')
  const [genLoading, setGenLoading] = useState(false)

  // Dialog para ver detalhes PIX
  const [pixDetail, setPixDetail] = useState<any>(null)

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (filterStatus !== 'all') params.set('status', filterStatus)
  if (filterType !== 'all') params.set('type', filterType)
  if (search) params.set('search', search)

  const { data, isLoading, mutate } = useSWR(
    `/api/gateways/payment-links?${params}`, fetcher, { refreshInterval: 30000 }
  )

  const links = data?.links || []
  const stats = data?.stats || {}

  // Gerar link
  async function handleGenerate() {
    if (!genInvoiceNum.trim()) {
      toast.error('Informe o número da fatura')
      return
    }
    setGenLoading(true)
    try {
      // Buscar fatura pelo número (precisamos do ID)
      const invRes = await fetch(`/api/finance/invoices?search=${encodeURIComponent(genInvoiceNum.trim())}`)
      const invData = await invRes.json()
      const invoice = invData?.invoices?.find((i: any) => i.number === genInvoiceNum.trim())
      if (!invoice) {
        toast.error('Fatura não encontrada')
        setGenLoading(false)
        return
      }

      const endpoint = genType === 'pix' ? '/api/gateways/pix' : '/api/gateways/boleto'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erro ao gerar')

      toast.success(`${genType === 'pix' ? 'PIX' : 'Boleto'} gerado com sucesso!`)
      setGenOpen(false)
      setGenInvoiceNum('')
      mutate()

      if (genType === 'pix') {
        setPixDetail(result)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGenLoading(false)
    }
  }

  // Copiar PIX
  function copyPix(code: string) {
    navigator.clipboard.writeText(code)
    toast.success('Código PIX copiado!')
  }

  // Excluir
  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/gateways/payment-links/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Link removido')
      mutate()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Links de Pagamento</h2>
          <p className="text-sm text-muted-foreground">Gere e gerencie links PIX e boletos para faturas</p>
        </div>
        <Button onClick={() => setGenOpen(true)}>
          <QrCode className="h-4 w-4 mr-2" /> Gerar Link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total || 0, icon: CreditCard, color: 'text-blue-600' },
          { label: 'Pendentes', value: stats.pending || 0, icon: Clock, color: 'text-yellow-600' },
          { label: 'Pagos', value: stats.paid || 0, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Expirados', value: stats.expired || 0, icon: XCircle, color: 'text-red-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por fatura ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : links.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum link de pagamento gerado</p>
            <p className="text-sm">Clique em &quot;Gerar Link&quot; para criar um PIX ou boleto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((link: any) => {
            const st = STATUS_MAP[link.status] || STATUS_MAP.pending
            const tp = TYPE_MAP[link.type] || TYPE_MAP.pix
            const StIcon = st.icon
            const TpIcon = tp.icon
            return (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Tipo */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className={`p-2 rounded-lg ${link.type === 'pix' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        <TpIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tp.label}</p>
                        <p className="text-xs text-muted-foreground">{link.gateway}</p>
                      </div>
                    </div>

                    {/* Fatura + Cliente */}
                    <div className="flex-1">
                      <p className="font-medium">{link.invoice?.number || '—'}</p>
                      <p className="text-sm text-muted-foreground">{link.invoice?.customer?.name || '—'}</p>
                    </div>

                    {/* Valor */}
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold">{formatBRL(Number(link.amount))}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                      <StIcon className="h-3.5 w-3.5" />
                      {st.label}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      {link.type === 'pix' && link.pixCode && (
                        <Button variant="ghost" size="icon" onClick={() => copyPix(link.pixCode)} title="Copiar PIX">
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {link.type === 'pix' && link.pixQrBase64 && (
                        <Button variant="ghost" size="icon" onClick={() => setPixDetail(link)} title="Ver QR Code">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(link.id)} title="Excluir">
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

      {/* Dialog Gerar Link */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Link de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Número da Fatura</label>
              <Input
                placeholder="FAT-2026-00001"
                value={genInvoiceNum}
                onChange={(e) => setGenInvoiceNum(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX (QR Code + Copia-e-cola)</SelectItem>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerate} disabled={genLoading}>
              {genLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gerar {genType === 'pix' ? 'PIX' : 'Boleto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog PIX Detail */}
      <Dialog open={!!pixDetail} onOpenChange={(o) => !o && setPixDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-600" /> PIX Gerado
            </DialogTitle>
          </DialogHeader>
          {pixDetail && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Fatura: <strong>{pixDetail.invoiceNumber || pixDetail.invoice?.number}</strong>
                {pixDetail.customerName && <> • {pixDetail.customerName}</>}
                {pixDetail.invoice?.customer?.name && <> • {pixDetail.invoice.customer.name}</>}
              </p>
              <p className="text-2xl font-bold text-green-700">
                {formatBRL(Number(pixDetail.amount))}
              </p>

              {/* QR Code */}
              {pixDetail.pixQrBase64 && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pixDetail.pixQrBase64}
                    alt="QR Code PIX"
                    className="w-[250px] h-[250px] rounded-lg border"
                  />
                </div>
              )}

              {/* Copia-e-cola */}
              {pixDetail.pixCode && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Código PIX (copia e cola):</p>
                  <div className="bg-muted p-3 rounded-lg text-xs font-mono break-all max-h-24 overflow-y-auto">
                    {pixDetail.pixCode}
                  </div>
                  <Button
                    onClick={() => copyPix(pixDetail.pixCode)}
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copiar Código
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link?</AlertDialogTitle>
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
