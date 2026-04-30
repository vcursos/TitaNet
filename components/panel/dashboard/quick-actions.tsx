// =============================================================================
// Ações Rápidas - dashboard
// =============================================================================
// Botões de acesso rápido para tarefas comuns.
// Para adicionar uma nova ação, basta acrescentar um item no array `actions`.
// =============================================================================
'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { UserPlus, FileSignature, Package, Settings, Wifi, BarChart3 } from 'lucide-react'

const actions = [
  {
    label: 'Novo Cliente',
    href: '/customers',
    icon: UserPlus,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-950',
  },
  {
    label: 'Novo Contrato',
    href: '/contracts',
    icon: FileSignature,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-950',
  },
  {
    label: 'Novo Plano',
    href: '/plans',
    icon: Package,
    color: 'text-green-600 bg-green-100 dark:bg-green-950',
  },
  {
    label: 'Monitoramento',
    href: '/customers',
    icon: Wifi,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950',
  },
  {
    label: 'Relatórios',
    href: '/dashboard',
    icon: BarChart3,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-950',
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: Settings,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-900',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold tracking-tight">Ações Rápidas</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition"
            >
              <div className={`size-10 rounded-md grid place-items-center ${a.color} group-hover:scale-105 transition-transform`}>
                <a.icon className="size-5" />
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-center text-muted-foreground group-hover:text-foreground line-clamp-2">
                {a.label}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
