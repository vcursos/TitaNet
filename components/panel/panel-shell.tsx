'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Package, FileSignature, Settings as SettingsIcon,
  LogOut, Menu, X, Network, ChevronDown, ChevronRight,
  Wrench, MapPin, Server, Building2, ClipboardList, ShieldCheck,
  DollarSign, Receipt, CreditCard, BarChart3,
  MessageSquare, Mail, Send, Inbox,
  Radio, Monitor, Plug2,
  Boxes, ArrowRightLeft,
  Webhook, Bell, Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useThemeColors } from '@/components/theme-colors-provider'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

// =============================================================================
// Estrutura da navegação lateral
// - itens simples: { type: 'link', href, label, icon }
// - grupos colapsáveis: { type: 'group', label, icon, children: [...] }
//
// Para extender em etapas futuras, basta adicionar novos grupos/links.
// =============================================================================
type NavItem =
  | { type: 'link'; href: string; label: string; icon: any }
  | { type: 'group'; key: string; label: string; icon: any; children: { href: string; label: string; icon: any }[] }

const nav: NavItem[] = [
  { type: 'link', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { type: 'link', href: '/customers', label: 'Clientes', icon: Users },
  { type: 'link', href: '/plans', label: 'Planos', icon: Package },
  { type: 'link', href: '/contracts', label: 'Contratos', icon: FileSignature },
  { type: 'link', href: '/service-orders', label: 'Ordens de Serviço', icon: ClipboardList },
  {
    type: 'group',
    key: 'finance',
    label: 'Financeiro',
    icon: DollarSign,
    children: [
      { href: '/finance/dashboard', label: 'Resumo', icon: BarChart3 },
      { href: '/finance/invoices', label: 'Faturas', icon: Receipt },
      { href: '/finance/payments', label: 'Pagamentos', icon: CreditCard },
    ],
  },
  {
    type: 'group',
    key: 'network',
    label: 'Rede',
    icon: Radio,
    children: [
      { href: '/network/monitor', label: 'Monitor', icon: Monitor },
      { href: '/network/devices', label: 'Equipamentos', icon: Plug2 },
      { href: '/network/connections', label: 'Conexões', icon: Network },
    ],
  },
  {
    type: 'group',
    key: 'inventory',
    label: 'Estoque',
    icon: Boxes,
    children: [
      { href: '/inventory/dashboard', label: 'Resumo', icon: Package },
      { href: '/inventory/items', label: 'Itens', icon: Boxes },
      { href: '/inventory/movements', label: 'Movimentações', icon: ArrowRightLeft },
    ],
  },
  {
    type: 'group',
    key: 'communication',
    label: 'Comunicação',
    icon: MessageSquare,
    children: [
      { href: '/communication/send', label: 'Enviar', icon: Send },
      { href: '/communication/templates', label: 'Templates', icon: Mail },
      { href: '/communication/logs', label: 'Histórico', icon: Inbox },
    ],
  },
  {
    type: 'group',
    key: 'gateways',
    label: 'Gateways',
    icon: Webhook,
    children: [
      { href: '/gateways/payments', label: 'Pagamentos', icon: Link2 },
      { href: '/gateways/notifications', label: 'Notificações', icon: Bell },
    ],
  },
  {
    type: 'group',
    key: 'admin',
    label: 'Administração',
    icon: ShieldCheck,
    children: [
      { href: '/administration/users', label: 'Usuários', icon: Users },
      { href: '/administration/technicians', label: 'Técnicos', icon: Wrench },
      { href: '/administration/cities', label: 'Cidades', icon: MapPin },
      { href: '/administration/pops', label: 'POPs', icon: Network },
      { href: '/administration/servers', label: 'Servidores', icon: Server },
      { href: '/administration/condominiums', label: 'Condomínios', icon: Building2 },
    ],
  },
  { type: 'link', href: '/settings', label: 'Configurações', icon: SettingsIcon },
]

export function PanelShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode
  userName: string
  userEmail: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { companyName } = useThemeColors()

  // Estado de grupos abertos (chave do grupo => true/false)
  // Auto-abre quando alguma rota filha está ativa.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of nav) {
      if (item.type === 'group') {
        initial[item.key] = item.children.some((c) => pathname === c.href || pathname?.startsWith(c.href + '/'))
      }
    }
    return initial
  })

  // Sempre que mudar a rota, garantir que o grupo correspondente fica aberto.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const item of nav) {
        if (item.type === 'group') {
          const hasActive = item.children.some((c) => pathname === c.href || pathname?.startsWith(c.href + '/'))
          if (hasActive) next[item.key] = true
        }
      }
      return next
    })
  }, [pathname])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.replace('/login')
  }

  const renderNavItem = (item: NavItem, onClickItem?: () => void) => {
    if (item.type === 'link') {
      const active = pathname === item.href || pathname?.startsWith(item.href + '/')
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClickItem}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition',
            active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      )
    }

    // Grupo colapsável
    const isOpen = openGroups[item.key] ?? false
    const hasActiveChild = item.children.some(
      (c) => pathname === c.href || pathname?.startsWith(c.href + '/')
    )

    return (
      <div key={item.key} className="space-y-1">
        <button
          type="button"
          onClick={() => setOpenGroups((p) => ({ ...p, [item.key]: !p[item.key] }))}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition',
            hasActiveChild
              ? 'text-foreground bg-muted/60'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <item.icon className="size-4" />
          <span className="flex-1 text-left">{item.label}</span>
          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        {isOpen && (
          <div className="ml-4 pl-3 border-l border-border space-y-1">
            {item.children.map((c) => {
              const active = pathname === c.href || pathname?.startsWith(c.href + '/')
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={onClickItem}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <c.icon className="size-3.5" />
                  {c.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border hidden lg:flex flex-col z-30">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-9 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <Network className="size-5" />
            </div>
            <div>
              <div className="font-display font-bold tracking-tight leading-none">{companyName}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Painel ISP</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => renderNavItem(item))}
        </nav>
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition">
                <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                  {userName?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">{userName}</div>
                  <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <SettingsIcon className="size-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="size-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <span className="font-display font-bold">{companyName}</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {nav.map((item) => renderNavItem(item, () => setSidebarOpen(false)))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 h-16 bg-card/80 backdrop-blur border-b border-border flex items-center px-4 lg:px-8 gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="size-4" /> Sair
          </Button>
        </header>
        <main className="p-4 lg:p-8 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </div>
  )
}
