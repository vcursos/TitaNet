// =============================================================================
// Banner de Boas-vindas - dashboard
// =============================================================================
// Componente isolado: pode ser editado/removido sem afetar o restante.
// =============================================================================
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

interface WelcomeBannerProps {
  userName?: string | null
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  // Saudação dinâmica baseada na hora
  const hours = now?.getHours() ?? 0
  const greeting = !now
    ? 'Bem-vindo'
    : hours < 12
      ? 'Bom dia'
      : hours < 18
        ? 'Boa tarde'
        : 'Boa noite'

  const dateLabel = now
    ? now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const timeLabel = now
    ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : ''

  const firstName = userName?.split(' ')?.[0] ?? 'Administrador'

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
      <CardContent className="p-6 sm:p-8 relative">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-5 -bottom-10 size-32 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/80 font-medium">
            <Sparkles className="size-3.5" /> {dateLabel || 'Carregando…'}{timeLabel ? ` · ${timeLabel}` : ''}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-2">
            {greeting}, {firstName}!
          </h1>
          <p className="text-primary-foreground/90 mt-1 text-sm sm:text-base">
            Aqui está a visão geral do seu provedor em tempo real.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
