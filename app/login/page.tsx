"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { login, DEMO_CREDENTIALS } from "@/lib/demo/auth"
import { Loader2, ShoppingBag, BarChart3, Users, Zap } from "lucide-react"

const FEATURES = [
  { icon: ShoppingBag, text: "Gestión de pedidos en tiempo real" },
  { icon: BarChart3,   text: "Análisis de rendimiento y ventas" },
  { icon: Users,      text: "Administración de clientes" },
  { icon: Zap,        text: "Flujo de trabajo optimizado" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState(DEMO_CREDENTIALS.email)
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    if (login(email, password)) {
      router.push("/")
    } else {
      setError("Credenciales incorrectas")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel — brand ───────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden">

        {/* Subtle gradient orb */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        {/* Second orb stays indigo on purpose (design.md Decision 5) — migrating it would either
            flatten the gradient into two identical oranges or invent a second decorative hue. */}
        <div className="absolute -bottom-32 -right-16 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Morfito" className="h-9 w-9 rounded-xl object-cover" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Morfito</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Operaciones simples.<br />
              <span className="text-zinc-400">Resultados reales.</span>
            </h1>
            <p className="text-zinc-500 text-base leading-relaxed max-w-sm">
              Sistema de gestión para restaurantes. Pedidos, clientes, métricas
              y más — todo en un solo lugar.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-zinc-400 text-sm">
                <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-zinc-300" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-zinc-600 text-xs relative z-10">
          © {new Date().getFullYear()} Morfito · Modo demo
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-zinc-900 p-8">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logo.webp" alt="Morfito" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-white font-semibold">Morfito</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-white text-2xl font-semibold">Bienvenido</h2>
            <p className="text-zinc-500 text-sm">Ingresá tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500 focus-visible:border-zinc-500 h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-300 text-sm">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500 focus-visible:border-zinc-500 h-10"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-white text-zinc-900 hover:bg-zinc-100 font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3.5 space-y-1.5">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Credenciales demo</p>
            <div className="space-y-0.5">
              <p className="text-zinc-300 text-xs font-mono">{DEMO_CREDENTIALS.email}</p>
              <p className="text-zinc-300 text-xs font-mono">{DEMO_CREDENTIALS.password}</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
