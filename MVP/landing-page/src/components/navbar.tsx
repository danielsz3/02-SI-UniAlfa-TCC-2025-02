"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LogIn,
  LogOut,
  User,
  PawPrint,
  ChevronDown,
  Menu as MenuIcon,
  X as CloseIcon,
  HeartHandshake,
  HandHeart,
} from "lucide-react"
import Image from "next/image"

type MeResponse =
  | { authenticated: true; id?: number | string; name?: string; email?: string; avatarUrl?: string; role?: string }
  | { authenticated: false }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

// -------- API --------
async function apiMe(token: string): Promise<MeResponse> {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) return { authenticated: false }
    const data = await res.json()
    return {
      authenticated: true,
      id: data?.id,
      name: data?.nome ?? data?.name ?? data?.username ?? "",
      email: data?.email ?? "",
      avatarUrl: data?.avatar ?? data?.avatar_url ?? data?.foto ?? "",
      role: data?.role ?? data?.perfil ?? "",
    }
  } catch {
    return { authenticated: false }
  }
}

async function apiLogout(token?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    return res.ok
  } catch {
    return false
  }
}

// -------- UI --------
function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logo.svg" alt="PetAffinity" width={32} height={32} />
      <span className="text-xl font-bold tracking-tight">PetAffinity</span>
    </Link>
  )
}

function TopLevelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      {children}
    </Link>
  )
}

function DonateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          DOAR
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel className="flex items-center gap-2">
          <HandHeart className="h-4 w-4 text-primary" />
          Doações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/doar-pet">Doar um Pet</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/doar-ong">Doar para a ONG</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/lar-temporario">Lares Temporários</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AboutMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          SOBRE
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-primary" />
          Institucional
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/sobre">Sobre</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/portal-transparencia">Portal de Transparência</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CenterNav() {
  return (
    <nav className="hidden md:flex items-center gap-6">
      <TopLevelLink href="/adotar">ADOTAR UM PET</TopLevelLink>
      <DonateMenu />
      <AboutMenu />
    </nav>
  )
}

function RightActions({
  me,
  onLogoutClick,
  loading,
}: {
  me: MeResponse
  onLogoutClick: () => Promise<void>
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />

      {loading ? (
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
      ) : me.authenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={(me as any).avatarUrl || undefined}
                  alt={(me as any).name ?? "Usuário"}
                />
                <AvatarFallback>
                  {(me as any).name ? (me as any).name[0]?.toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Cabeçalho com nome/email */}
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium leading-tight truncate">{(me as any).name ?? "Usuário"}</span>
                <span className="text-xs text-muted-foreground truncate">{(me as any).email ?? ""}</span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Item Perfil */}
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>

            {/* Separador entre Perfil e Sair */}
            <DropdownMenuSeparator />

            {/* Item Sair */}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={onLogoutClick}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/login">
            <LogIn className="h-4 w-4" />
            Entrar
          </Link>
        </Button>
      )}
    </div>
  )
}

export function Navbar() {
  const router = useRouter()
  const [me, setMe] = useState<MeResponse>({ authenticated: false })
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      // Chama /me apenas se houver token
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""
      if (!token) {
        if (active) setLoading(false)
        return
      }
      const res = await apiMe(token)
      if (active) {
        setMe(res)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleLogout = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined
    const ok = await apiLogout(token)
    localStorage.removeItem("token")
    if (ok) {
      setMe({ authenticated: false })
      router.refresh()
      router.push("/")
    }
  }

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <div className="flex items-center gap-3">
          {/* Mobile toggle */}
          <button
            className="md:hidden -ml-2 p-2 rounded hover:bg-accent"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
          <Brand />
        </div>

        <CenterNav />

        <RightActions me={me} onLogoutClick={handleLogout} loading={loading} />
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-3">
            <Link
              href="/adotar"
              className="block text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              ADOTAR UM PET
            </Link>

            {/* DOAR submenu */}
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Doar</div>
              <div className="flex flex-col gap-2">
                <Link href="/doar-pet" onClick={() => setMobileOpen(false)} className="text-sm hover:text-primary">
                  Doar um Pet
                </Link>
                <Link href="/doar-ong" onClick={() => setMobileOpen(false)} className="text-sm hover:text-primary">
                  Doar para a ONG
                </Link>
                <Link href="/lar-temporario" onClick={() => setMobileOpen(false)} className="text-sm hover:text-primary">
                  Lares Temporários
                </Link>
              </div>
            </div>

            {/* SOBRE submenu */}
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Sobre</div>
              <div className="flex flex-col gap-2">
                <Link href="/sobre" onClick={() => setMobileOpen(false)} className="text-sm hover:text-primary">
                  Sobre
                </Link>
                <Link
                  href="/portal-transparencia"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm hover:text-primary"
                >
                  Portal de Transparência
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
