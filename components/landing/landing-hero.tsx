'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, Wifi, Activity, Users } from 'lucide-react'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <Wifi className="size-3" /> Plataforma para provedores de internet
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Gestão completa do seu <span className="text-primary">provedor</span> em um só lugar.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Clientes, planos, contratos, monitoramento de OLT e MikroTik, validação pela Receita Federal e muito mais — com arquitetura modular pronta para crescer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup"><Button size="lg" className="gap-2">Começar agora <ArrowRight className="size-4" /></Button></Link>
              <Link href="/login"><Button size="lg" variant="outline">Já tenho conta</Button></Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-lg bg-card border border-border shadow-lg p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">titanet.app/dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { icon: Users, label: 'Clientes', value: '1.284' },
                  { icon: Activity, label: 'Online', value: '1.197' },
                  { icon: Wifi, label: 'Receita', value: 'R$ 128k' },
                ].map((s, i) => (
                  <div key={i} className="rounded-md bg-muted/50 p-4">
                    <s.icon className="size-4 text-primary mb-2" />
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="font-display font-bold text-lg">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {['João da Silva', 'Maria Souza', 'Pedro Almeida'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                    <span>{name}</span>
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <span className="size-2 rounded-full bg-green-500" /> Online
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
