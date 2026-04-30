// =============================================================================
// PaymentsView - histórico de pagamentos registrados
// =============================================================================
'use client'

import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Search, CreditCard, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { formatBRL } from '@/lib/format'

const METHODS: Record<string, string> = {
  pix: 'PIX', boleto: 'Boleto', card: 'Cartão', cash: 'Dinheiro',
  transfer: 'Transferência', other: 'Outro',
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PaymentsView() {
  const [search, setSearch] = useState('')
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  const url = `/api/finance/payments${params}`
  const { data, isLoading } = useSWR<any[]>(url, fetcher)

  const [deleting, setDeleting] = useState<any>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)
  const refresh = () => globalMutate(url)

  const confirmDelete = async () => {
    if (!deleting) return
    setDeletingLoading(true)
    try {
      const r = await fetch(`/api/finance/payments/${deleting.id}`, { method: 'DELETE' })
      if (!r.ok) { toast.error('Erro ao excluir'); return }
      toast.success('Pagamento removido (fatura recalculada)');
      setDeleting(null); refresh()
    } finally { setDeletingLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-green-600" />
          Pagamentos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico de todos os pagamentos registrados.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente ou comprovante..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum pagamento encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Data</th>
                    <th className="px-4 py-3 text-left font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium">Fatura</th>
                    <th className="px-4 py-3 text-left font-medium">Forma</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-left font-medium">Referência</th>
                    <th className="px-4 py-3 text-right font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs">
                        {new Date(p.paymentDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">{p.customer?.name ?? '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.invoice?.number ?? '-'}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {METHODS[p.paymentMethod] ?? p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        +{formatBRL(Number(p.amount))}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.reference ?? '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(p)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O pagamento será removido e a fatura vinculada (se houver) terá seu status recalculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletingLoading}
              className="bg-red-600 hover:bg-red-700">
              {deletingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Estornar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
