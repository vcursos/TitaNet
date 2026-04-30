// =============================================================================
// Busca Rápida de Clientes - dashboard
// =============================================================================
// Input com autocomplete que dispara /api/customers/search.
// Para evoluir: trocar por Command palette com atalho ⌘K.
// =============================================================================
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatDocument, statusLabel } from '@/lib/format'

interface SearchResult {
  id: string
  name: string
  document: string
  status: string
  plan?: { name: string } | null
}

export function QuickSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounce
  useEffect(() => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/customers/search?q=${encodeURIComponent(trimmed)}`)
        const data = await r.json()
        setResults(data.results ?? [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder="Buscar cliente por nome, CPF/CNPJ, email ou telefone..."
          className="pl-9 pr-9 h-11"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        ) : q ? (
          <button
            type="button"
            onClick={() => { setQ(''); setResults([]); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-5 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Limpar"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-2 rounded-lg border bg-popover text-popover-foreground shadow-lg max-h-96 overflow-auto">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhum cliente encontrado para &quot;{q}&quot;.
            </div>
          ) : (
            <ul className="py-1">
              {results.map((r) => {
                const status = statusLabel(r.status)
                return (
                  <li key={r.id}>
                    <Link
                      href={`/customers/${r.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/60 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center font-medium shrink-0">
                          {r.name?.[0]?.toUpperCase() ?? 'C'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{r.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatDocument(r.document)}{r.plan?.name ? ` · ${r.plan.name}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color} shrink-0`}>
                        {status.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
