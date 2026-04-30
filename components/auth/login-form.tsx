'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Lock, Loader2, Network } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.error) {
        toast.error('Email ou senha inválidos')
      } else {
        toast.success('Bem-vindo!')
        router.replace('/dashboard')
      }
    } catch {
      toast.error('Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-9 rounded-md bg-primary-foreground/10 grid place-items-center">
            <Network className="size-5" />
          </div>
          <span className="font-display font-bold text-xl">TitaNet</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
          <p className="opacity-80 mt-2">Acesse o painel para gerenciar seu provedor de internet.</p>
        </div>
        <div className="text-xs opacity-60">© {new Date().getFullYear()} TitaNet — Plataforma de Gestão ISP</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
          <Link href="/" className="flex items-center gap-2 lg:hidden mb-6">
            <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">T</div>
            <span className="font-display font-bold text-lg">TitaNet</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Entrar na conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Acesse o painel administrativo</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="voce@empresa.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="••••••••" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Entrar'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Não tem conta? <Link href="/signup" className="text-primary font-medium hover:underline">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
