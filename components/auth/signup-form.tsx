'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Lock, User, Loader2, Network } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao criar conta')
        return
      }
      toast.success('Conta criada! Fazendo login...')
      const signin = await signIn('credentials', { email, password, redirect: false })
      if (signin?.error) {
        router.replace('/login')
      } else {
        router.replace('/dashboard')
      }
    } catch {
      toast.error('Erro ao criar conta')
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
          <h2 className="font-display text-3xl font-bold tracking-tight">Comece em minutos</h2>
          <p className="opacity-80 mt-2">Crie sua conta e configure seu provedor.</p>
        </div>
        <div className="text-xs opacity-60">© {new Date().getFullYear()} TitaNet</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
          <Link href="/" className="flex items-center gap-2 lg:hidden mb-6">
            <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">T</div>
            <span className="font-display font-bold text-lg">TitaNet</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Cadastre-se para acessar o painel</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="Seu nome" />
            </div>
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
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Criar conta'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Já tem conta? <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
