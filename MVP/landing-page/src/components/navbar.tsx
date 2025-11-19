"use client"

import Link from "next/link"
import { useState } from "react"
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
    ChevronDown,
    Menu as MenuIcon,
    X as CloseIcon,
    HeartHandshake,
    HandHeart,
    PawPrint,
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/Providers"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

interface User {
    nome?: string;
    email?: string;
    imagem?: string;
}

async function apiLogout(token: string | null | undefined) {
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

function Brand() {
    return (
        <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PetAffinity" width={32} height={32} />
            <span className="text-xl font-bold tracking-tight">PetAffinity</span>
        </Link>
    )
}

function TopLevelLink({ href, children }: { href: string, children: ReactNode }) {
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
                    <ChevronDown className="h-4 w-4" />
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
                    <Link href="/lar-temporario">Ser um Lar Temporários</Link>
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
                    <ChevronDown className="h-4 w-4" />
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

function RightActions({ loading, onLogout, user }: { loading: boolean, onLogout: () => void, user: User }) {
    return (
        <div className="flex items-center gap-3">
            <ThemeToggle />

            {loading ? (
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={`${API_BASE}/imagens/${user.imagem}`} alt={user.nome ?? "Usuário"} />
                                <AvatarFallback>{user.nome?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col">
                                <span className="font-medium truncate">{user.nome ?? "Usuário"}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email ?? ""}</span>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                            <Link href="/perfil/editar" className="flex items-center gap-2 cursor-pointer">
                                <User className="h-4 w-4" />
                                Perfil
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link href="/painel-adotante" className="flex items-center gap-2 cursor-pointer">
                                <PawPrint className="h-4 w-4" />
                                Painel do adotante
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={onLogout}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                            <div className="flex items-center gap-2 hover:text-white size-full">
                                <LogOut className="h-4 w-4 hover:text-red-500" />
                                <span>Sair</span>
                            </div>
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
    const { user, logout } = useAuth()
    const [loading, setLoading] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""

        await apiLogout(token)
        logout()

        setLoading(false)
        router.push("/login")
    }

    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">

                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden -ml-2 p-2 rounded hover:bg-accent"
                        onClick={() => setMobileOpen(v => !v)}
                        aria-label="Abrir menu"
                    >
                        {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                    </button>

                    <Brand />
                </div>

                <CenterNav />

                <RightActions loading={loading} onLogout={handleLogout} user={user} />
            </div>

            {mobileOpen && (
                <div className="md:hidden border-t bg-background">
                    <div className="mx-auto max-w-6xl px-4 py-3 space-y-3">

                        <Link
                            href="/adotar"
                            onClick={() => setMobileOpen(false)}
                            className="block text-sm font-medium text-muted-foreground hover:text-primary"
                        >
                            ADOTAR UM PET
                        </Link>

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
                                    Ser um Lar Temporário
                                </Link>
                            </div>
                        </div>

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