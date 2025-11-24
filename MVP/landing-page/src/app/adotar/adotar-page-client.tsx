"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Animal, AgeRangeKey } from "@/types"
import { ageRangeToBirthdateRange } from "@/lib/animal-utils"
import { AnimalFilters } from "@/components/animal/AnimalFilters"
import { AnimalCard } from "@/components/animal/AnimalCard"
import { PaginationControls } from "@/components/animal/PaginationControls"
import { AnimalDetailModal } from "@/components/animal/AnimalDetailModal"

export default function AdotarPageClient() {
    const [animais, setAnimais] = useState<Animal[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)

    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number | null>(null)
    const [perPage, setPerPage] = useState<number>(8)
    const pageSizeOptions = [5, 10, 25, 50]

    const [fullItems, setFullItems] = useState<Animal[] | null>(null)

    const [tipoAnimal, setTipoAnimal] = useState<string>("all")
    const [sexo, setSexo] = useState<string>("all")
    const [ageRange, setAgeRange] = useState<AgeRangeKey>("any")

    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    const prefetchControllerRef = useRef<AbortController | null>(null)
    const componentUnmountedRef = useRef(false)

    const [tokenExiste, setTokenExiste] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")
        setTokenExiste(!!token)
    }, [])

    const buildPageUrl = useCallback((page: number, perArg?: number) => {
        const effectivePer = perArg ?? perPage
        const start = (page - 1) * effectivePer
        const end = page * effectivePer - 1

        const filterObj: Record<string, string[]> = { situacao: ["disponivel", "em_adocao"] }
        if (tipoAnimal && tipoAnimal !== "all") filterObj.tipo_animal = [tipoAnimal]
        if (sexo && sexo !== "all") filterObj.sexo = [sexo]
        if (ageRange !== "any") {
            const { from, to } = ageRangeToBirthdateRange(ageRange)
            if (from) filterObj.data_nascimento_from = [from]
            if (to) filterObj.data_nascimento_to = [to]
        }

        const params = new URLSearchParams()
        params.set('range', `[${start},${end}]`)
        params.set('filter', JSON.stringify(filterObj))
        params.set("sort", JSON.stringify(["updated_at", "DESC"]))

        return `${apiUrl}/animais?${params.toString()}`
    }, [apiUrl, tipoAnimal, sexo, ageRange, perPage])

    const parseResponse = useCallback(async (res: Response) => {
        if (!res.ok) {
            const text = await res.text()
            throw new Error(text || `HTTP ${res.status}`)
        }
        const json = await res.json()
        if (Array.isArray(json)) {
            return { items: json as Animal[], mode: "none" as const, currentPage: null, lastPage: null, total: (json as any).length ?? null }
        }
        if (Array.isArray(json.data)) {
            const items = json.data as Animal[]
            const current = json.meta?.current_page ?? null
            const last = json.meta?.last_page ?? null
            const total = json.meta?.total ?? null
            return { items, mode: "pages" as const, currentPage: current, lastPage: last, total }
        }
        const items = Array.isArray(json.data) ? json.data : []
        return { items: items as Animal[], mode: "none" as const, currentPage: null, lastPage: null, total: null }
    }, [])

    const loadPage = useCallback(async (page: number, perArg?: number) => {
        prefetchControllerRef.current?.abort()
        prefetchControllerRef.current = new AbortController()
        const signal = prefetchControllerRef.current.signal

        setLoading(true)
        setError(null)

        const effectivePer = perArg ?? perPage

        try {
            if (fullItems) {
                const pages = Math.max(1, Math.ceil(fullItems.length / effectivePer))
                const safePage = Math.min(Math.max(1, page), pages)
                const start = (safePage - 1) * effectivePer
                setAnimais(fullItems.slice(start, start + effectivePer))
                setCurrentPage(safePage)
                setTotalPages(pages)
                return
            }

            const url = buildPageUrl(page, perArg)
            const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal })

            const totalFromHeader = (() => {
                const xTotal = res.headers.get("X-Total-Count")
                if (xTotal) { const n = Number(xTotal); return Number.isFinite(n) ? n : null }
                const contentRange = res.headers.get("Content-Range")
                if (contentRange) {
                    const m = contentRange.match(/\/(\d+)\s*$/)
                    if (m) { const n = Number(m[1]); return Number.isFinite(n) ? n : null }
                }
                return null
            })()

            const parsed = await parseResponse(res)

            if (parsed.mode === "none") {
                const items = parsed.items ?? []
                if (totalFromHeader !== null) {
                    const pages = Math.max(1, Math.ceil(totalFromHeader / effectivePer))
                    const safePage = Math.min(Math.max(1, page), pages)
                    setAnimais(items)
                    setCurrentPage(safePage)
                    setTotalPages(pages)
                    return
                }

                setFullItems(items)
                const total = parsed.total ?? items.length
                const pages = Math.max(1, Math.ceil((total || 0) / effectivePer))
                const safePage = Math.min(Math.max(1, page), pages)
                const start = (safePage - 1) * effectivePer
                setAnimais(items.slice(start, start + effectivePer))
                setCurrentPage(safePage)
                setTotalPages(pages)
                return
            }

            setAnimais(parsed.items || [])
            const current = parsed.currentPage ?? page
            const last = parsed.lastPage ?? null

            if (last === null && totalFromHeader !== null) {
                const pages = Math.max(1, Math.ceil(totalFromHeader / effectivePer))
                setCurrentPage(current)
                setTotalPages(pages)
            } else {
                setCurrentPage(current)
                setTotalPages(last)
            }
        } catch (err: any) {
            if (err?.name !== "AbortError") {
                console.error("Erro ao carregar animais:", err)
                setError(err.message || "Erro ao carregar animais")
                setAnimais([])
                setTotalPages(null)
                setFullItems(null)
            }
        } finally {
            if (!componentUnmountedRef.current) setLoading(false)
        }
    }, [buildPageUrl, parseResponse, perPage, fullItems])

    useEffect(() => {
        componentUnmountedRef.current = false
        void loadPage(1)
        return () => {
            componentUnmountedRef.current = true
            prefetchControllerRef.current?.abort()
        }
    }, [])

    const applyFilters = () => {
        setFullItems(null)
        setTotalPages(null)
        setCurrentPage(1)
        void loadPage(1)
    }

    const resetFilters = () => {
        setTipoAnimal("all")
        setSexo("all")
        setAgeRange("any")
        setFullItems(null)
        setTotalPages(null)
        setCurrentPage(1)
        void loadPage(1)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        void loadPage(page)
    }

    const handlePageSizeChange = (newPer: number) => {
        setPerPage(newPer)
        setFullItems(null)
        setTotalPages(null)
        setCurrentPage(1)
        void loadPage(1, newPer)
    }

    return (
        <>
            <main className="min-h-screen py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold mb-2">Animais Para Adoção</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Encontre seu novo melhor amigo.
                        </p>

                        {tokenExiste && (
                            <div className="flex justify-center mb-6 mt-4">
                                <Button asChild className="px-8 py-4 text-lg">
                                    <Link href="/adotar/afinidade">Ir para Afinidade</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    <AnimalFilters
                        tipoAnimal={tipoAnimal}
                        onTipoAnimalChange={setTipoAnimal}
                        sexo={sexo}
                        onSexoChange={setSexo}
                        ageRange={ageRange}
                        onAgeRangeChange={setAgeRange}
                        onApply={applyFilters}
                        onReset={resetFilters}
                    />

                    {animais.length === 0 && !loading ? (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground text-lg mb-4">Nenhum animal disponível para adoção no momento.</p>
                            <Button asChild><Link href="/doar-pet">Cadastrar Animal</Link></Button>
                        </div>
                    ) : (
                        <>
                            <section key={`page-${currentPage}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {animais.map((animal) => (
                                    <AnimalCard
                                        key={animal.id}
                                        animal={animal}
                                        onShowDetails={() => setSelectedAnimal(animal)}
                                    />
                                ))}
                            </section>

                            <div className="mt-6 flex flex-col items-center gap-3">
                                {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                                {error && <p className="text-sm text-destructive">{error}</p>}

                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    perPage={perPage}
                                    pageSizeOptions={pageSizeOptions}
                                    loading={loading}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>

            <AnimalDetailModal
                buttonAdotar
                initialData={selectedAnimal}
                onClose={() => setSelectedAnimal(null)}
            />
        </>
    )
}
