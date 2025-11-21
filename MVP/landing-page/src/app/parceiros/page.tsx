"use client"

import { useState, useRef, useCallback, useEffect, ReactNode } from "react"

// Tipo para as props do Card
interface CardProps {
    className?: string
    children: ReactNode
    [key: string]: any
}

// Shadcn Card components
const Card = ({ className, children, ...props }: CardProps) => (
    <div
        className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ""}`}
        {...props}
    >
        {children}
    </div>
)

const CardContent = ({ className, children, ...props }: CardProps) => (
    <div className={`p-6 pt-0 ${className || ""}`} {...props}>
        {children}
    </div>
)

// Tipo do Parceiro
interface Parceiro {
    id: number
    nome: string
    descricao?: string | null
    url_site?: string | null
    imagem?: string | null
}

// Tipo para as props do ParceiroCard
interface ParceiroCardProps {
    parceiro: Parceiro
}

// Componente de Card do Parceiro
function ParceiroCard({ parceiro }: ParceiroCardProps) {
    const storageUrl =
        process.env.NEXT_PUBLIC_STORAGE_URL ?? "http://127.0.0.1:8000/api/imagens"

    const imagemUrl = parceiro.imagem ? `${storageUrl}/${parceiro.imagem}` : null

    const CardInner = (
        <Card className="group relative overflow-hidden rounded-xl border-4 border-gray-300 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-gray-400">
            <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden">
                    {/* Imagem de fundo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
                        {imagemUrl ? (
                            <img
                                src={imagemUrl}
                                alt={parceiro.nome}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg
                                    className="w-24 h-24 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Overlay degradê escuro */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                    {/* Textos embaixo */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 text-white">
                        <h3 className="text-2xl font-bold mb-2 drop-shadow-lg leading-tight">
                            {parceiro.nome}
                        </h3>

                        {parceiro.descricao && (
                            <p className="text-sm mb-1 drop-shadow-md line-clamp-2">
                                {parceiro.descricao}
                            </p>
                        )}

                        {parceiro.url_site && (
                            <p className="text-sm drop-shadow-md opacity-90">
                                {(() => {
                                    try {
                                        return new URL(parceiro.url_site).hostname
                                    } catch {
                                        return parceiro.url_site
                                    }
                                })()}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    // Se tiver URL, torna o card clicável
    if (parceiro.url_site) {
        return (
            <a
                href={parceiro.url_site}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
            >
                {CardInner}
            </a>
        )
    }

    return CardInner
}

// Componente principal da página
function App() {
    const [parceiros, setParceiros] = useState<Parceiro[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
    const prefetchControllerRef = useRef<AbortController | null>(null)
    const componentUnmountedRef = useRef(false)

    /** Parse da resposta da API */
    const parseResponse = useCallback(async (res: Response) => {
        if (!res.ok) {
            const text = await res.text()
            throw new Error(text || `HTTP ${res.status}`)
        }
        const json = await res.json()

        // Se retornar array direto
        if (Array.isArray(json)) {
            return json as Parceiro[]
        }

        // Se retornar { data: [...] }
        if (Array.isArray(json.data)) {
            return json.data as Parceiro[]
        }

        return []
    }, [])

    /** Carrega os parceiros */
    const loadParceiros = useCallback(async () => {
        prefetchControllerRef.current?.abort()
        prefetchControllerRef.current = new AbortController()
        const signal = prefetchControllerRef.current.signal

        setLoading(true)
        setError(null)

        try {
            const url = `${apiUrl}/parceiros`
            const res = await fetch(url, {
                cache: "no-store",
                headers: { Accept: "application/json" },
                signal
            })

            const data = await parseResponse(res)
            setParceiros(data)
        } catch (err: any) {
            if (err?.name !== "AbortError") {
                console.error("Erro ao carregar parceiros:", err)
                setError(err.message || "Erro ao carregar parceiros")
                setParceiros([])
            }
        } finally {
            if (!componentUnmountedRef.current) {
                setLoading(false)
            }
        }
    }, [apiUrl, parseResponse])

    // Carregamento inicial
    useEffect(() => {
        componentUnmountedRef.current = false
        void loadParceiros()

        return () => {
            componentUnmountedRef.current = true
            prefetchControllerRef.current?.abort()
        }
    }, [loadParceiros])

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">
                {/* Título */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Parceiros
                    </h1>
                    <div className="h-px bg-gray-300 max-w-xs mx-auto" />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-64 animate-pulse rounded-xl bg-gray-300 border-4 border-gray-200"
                            />
                        ))}
                    </div>
                )}

                {/* Error State (sem botão de tentar novamente) */}
                {error && !loading && (
                    <div className="text-center py-12">
                        <p className="text-red-600 text-lg mb-4">Erro: {error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && parceiros.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">
                            Nenhum parceiro cadastrado no momento.
                        </p>
                    </div>
                )}

                {/* Grid de Parceiros */}
                {!loading && !error && parceiros.length > 0 && (
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parceiros.map((parceiro) => (
                            <ParceiroCard key={parceiro.id} parceiro={parceiro} />
                        ))}
                    </section>
                )}
            </div>
        </main>
    )
}

export default App
