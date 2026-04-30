// =============================================================================
// Landing page pública do TitaNet
// =============================================================================
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Activity, Network, Users, FileSignature, Settings as SettingsIcon,
  ShieldCheck, Wifi, BarChart3, ArrowRight,
} from 'lucide-react'
import { LandingHero } from '@/components/landing/landing-hero'

export const dynamic = 'force-dynamic'

const features = [
  { icon: Users, title: 'Gestão de Clientes', desc: 'Cadastro completo com endereço, plano e validação pela Receita Federal.' },
  { icon: Network, title: 'Monitoramento', desc: 'Status online/offline e sinal da ONU integráveis com OLT e MikroTik.' },
  { icon: FileSignature, title: 'Contratos Digitais', desc: 'Geração de contratos em PDF prontos para assinatura digital.' },
  { icon: BarChart3, title: 'Dashboard', desc: 'Visão gerencial em tempo real: receita, inadimplência e crescimento.' },
  { icon: ShieldCheck, title: 'Segurança', desc: 'Autenticação robusta com bcrypt e sessões JWT criptografadas.' },
  { icon: SettingsIcon, title: 'Personalizável', desc: 'Cores, marca e integrações totalmente configuráveis pelo painel.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-display font-bold">T</div>
            <span className="font-display font-bold text-lg tracking-tight">TitaNet</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Recursos</a>
            <a href="#integrations" className="text-muted-foreground hover:text-foreground transition">Integrações</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link href="/signup"><Button size="sm" className="gap-1">Começar <ArrowRight className="size-4" /></Button></Link>
          </div>
        </div>
      </header>

      <LandingHero />

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary mb-2">Recursos</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Tudo que seu provedor precisa</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Uma plataforma modular pensada para escalar junto com sua operação.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} variant="interactive" className="group">
                <CardContent className="p-6">
                  <div className="size-11 rounded-md bg-primary/10 text-primary grid place-items-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-20">
        <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-primary mb-2">Integrações</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Conecte sua infraestrutura</h2>
            <p className="text-muted-foreground mt-3">Estrutura preparada para integração com OLTs, MikroTik, Receita Federal e serviços de assinatura digital. Adicione novas integrações sem reescrever o código.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {['Receita Federal', 'OLT (Huawei/ZTE/Fiberhome)', 'MikroTik RouterOS', 'ClickSign', 'DocuSign', 'Autentique'].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-border p-8 grid place-items-center">
              <div className="grid grid-cols-3 gap-4">
                {[Wifi, Network, Activity, ShieldCheck, FileSignature, BarChart3].map((Icon, i) => (
                  <div key={i} className="size-20 rounded-md bg-card shadow-md grid place-items-center text-primary">
                    <Icon className="size-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Pronto para profissionalizar seu provedor?</h2>
          <p className="mt-3 opacity-90">Crie sua conta e comece a usar agora mesmo.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup"><Button size="lg" variant="secondary" className="gap-2">Criar Conta <ArrowRight className="size-4" /></Button></Link>
            <Link href="/login"><Button size="lg" variant="glass-dark">Acessar Painel</Button></Link>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-primary text-primary-foreground grid place-items-center text-xs font-bold">T</div>
            <span>© {new Date().getFullYear()} TitaNet. Plataforma de Gestão ISP.</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition">Entrar</Link>
            <Link href="/signup" className="hover:text-foreground transition">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
