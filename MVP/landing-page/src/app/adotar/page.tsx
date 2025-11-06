"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Animal {
  id: number
  nome: string
  sexo: string
  tipo_animal: string
  tamanho?: string
  nivel_energia?: string
  data_nascimento?: string
  imagens?: Array<{ caminho: string }>
  created_at: string
}

type AgeRangeKey = "any" | "0_1" | "1_3" | "3_8" | "8_plus"

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return "Idade desconhecida"
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  const anos = hoje.getFullYear() - nascimento.getFullYear()
  const meses = hoje.getMonth() - nascimento.getMonth()

  if (anos === 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`
  return `${anos} ${anos === 1 ? "ano" : "anos"}`
}

function AnimalCard({ animal }: { animal: Animal }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"
  const storageUrl = `${apiBase}/imagens`
  const imagemUrl = animal.imagens?.[0]?.caminho ? `${storageUrl}/${animal.imagens[0].caminho}` : null

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-muted overflow-hidden">
        {imagemUrl ? (
          <img
            src={imagemUrl}
            alt={animal.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">Sem imagem</div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {animal.tamanho && <Badge variant="secondary" className="capitalize">{animal.tamanho}</Badge>}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{animal.nome}</CardTitle>
          <Badge variant="outline" className="capitalize shrink-0">{animal.sexo}</Badge>
        </div>
        <CardDescription className="capitalize">{animal.tipo_animal}</CardDescription>
      </CardHeader>

      <CardContent className="pb-3 space-y-1 text-sm text-muted-foreground">
        <p>{calcularIdade(animal.data_nascimento)}</p>
        {animal.nivel_energia && <p className="capitalize">Energia: {animal.nivel_energia}</p>}
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button asChild className="w-full">
          <Link href={`/adotar/afinidade/${animal.id}`}>Ver Detalhes</Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Cadastrado em {new Date(animal.created_at).toLocaleDateString("pt-BR")}
        </p>
      </CardFooter>
    </Card>
  )
}

//if TokenExiste: true / aparecer botão para ir para afinidade/page.tsx

/** converte chave de faixa etária em intervalo de nascimento (YYYY-MM-DD) */
function ageRangeToBirthdateRange(key: AgeRangeKey) {
  const hoje = new Date()
  const isoDate = (d: Date) => d.toISOString().split("T")[0]
  switch (key) {
    case "0_1": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 1)
      return { from: isoDate(from), to: isoDate(hoje) }
    }
    case "1_3": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 3)
      const to = new Date(hoje); to.setFullYear(to.getFullYear() - 1)
      return { from: isoDate(from), to: isoDate(to) }
    }
    case "3_8": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 8)
      const to = new Date(hoje); to.setFullYear(to.getFullYear() - 3)
      return { from: isoDate(from), to: isoDate(to) }
    }
    case "8_plus": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 100)
      const to = new Date(hoje); to.setFullYear(to.getFullYear() - 8)
      return { from: isoDate(from), to: isoDate(to) }
    }
    default:
      return {}
  }
}

export default function AdotarPageClient() {
  const [animais, setAnimais] = useState<Animal[]>([])
  const [loading, setLoading] = useState(false)
  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [perPage, setPerPage] = useState<number>(50)
  const pageSizeOptions = [5, 10, 25, 50]

  // Se API retornar array completo, armazenamos e paginamos no client
  const [fullItems, setFullItems] = useState<Animal[] | null>(null)

  // filtros (alterar não dispara fetch automaticamente)
  const [tipoAnimal, setTipoAnimal] = useState<string>("all")
  const [sexo, setSexo] = useState<string>("all")
  const [ageRange, setAgeRange] = useState<AgeRangeKey>("any")

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

  const prefetchControllerRef = useRef<AbortController | null>(null)
  const componentUnmountedRef = useRef(false)

  const [tokenExiste, setTokenExiste] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setTokenExiste(!!token)
  }, [])


  /**
   * Constrói a URL da API com base no estado atual dos filtros e da página.
   * Usa 'range' = "[start,end]" conforme solicitado e ordena por id DESC (mais recente).
   * Aceita perArg opcional para gerar range imediatamente quando perPage está sendo alterado.
   */
  const buildPageUrl = useCallback((page: number, perArg?: number) => {
    const effectivePer = perArg ?? perPage
    const start = (page - 1) * effectivePer
    const end = page * effectivePer - 1

    // 1. Objeto de Filtros
    const filterObj: Record<string, string> = {
      situacao: "disponivel",
    }
    if (tipoAnimal && tipoAnimal !== "all") {
      filterObj.tipo_animal = tipoAnimal
    }
    if (sexo && sexo !== "all") {
      filterObj.sexo = sexo
    }
    if (ageRange !== "any") {
      const { from, to } = ageRangeToBirthdateRange(ageRange)
      if (from) {
        filterObj.data_nascimento_from = from
      }
      if (to) {
        filterObj.data_nascimento_to = to
      }
    }

    // 2. Parâmetros da URL
    const params = new URLSearchParams()
    // 'range' é uma string literal '[start,end]'
    params.set('range', `[${start},${end}]`)
    // 'filter' é uma string JSON
    params.set('filter', JSON.stringify(filterObj))
    // ordenação padrão: mais recente primeiro
    params.set('sort', JSON.stringify(['id', 'DESC']))

    return `${apiUrl}/animais?${params.toString()}`
  }, [apiUrl, tipoAnimal, sexo, ageRange, perPage])

  // parseResponse é puro: retorna items + meta info, sem side-effects
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

  // delay utilitário para evitar flood
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

  /**
   * Carrega página. Aceita perArg opcional para forçar uso imediato de nova page size.
   * Lê também headers 'X-Total-Count' e 'Content-Range' para calcular totalPages quando API não retorna meta.
   */
  const loadPage = useCallback(async (page: number, perArg?: number) => {
    // cancelar prefetch anterior
    prefetchControllerRef.current?.abort()
    prefetchControllerRef.current = new AbortController()
    const signal = prefetchControllerRef.current.signal

    setLoading(true)
    setError(null)
    setBackgroundLoading(false)

    const effectivePer = perArg ?? perPage

    try {
      // Se já temos fullItems, paginar localmente usando effectivePer
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

      // 1) tentar extrair total dos headers (X-Total-Count ou Content-Range)
      const totalFromHeader = (() => {
        const xTotal = res.headers.get("X-Total-Count")
        if (xTotal) {
          const n = Number(xTotal)
          return Number.isFinite(n) ? n : null
        }
        const contentRange = res.headers.get("Content-Range") // ex: "items 0-9/42"
        if (contentRange) {
          const m = contentRange.match(/\/(\d+)\s*$/)
          if (m) {
            const n = Number(m[1])
            return Number.isFinite(n) ? n : null
          }
        }
        return null
      })()

      // 2) parse do body como antes
      const parsed = await parseResponse(res)

      // 3) comportamento combinado:
      // - se parseResponse trouxe meta (modo "pages"), use meta
      // - senão, se header trouxe total, calcule totalPages
      // - se nada, continuar com fallback fullItems / array completo
      if (parsed.mode === "none") {
        // API devolveu array de itens (slice ou full). Se header trouxe total, use-o
        const items = parsed.items ?? []
        if (totalFromHeader !== null) {
          const pages = Math.max(1, Math.ceil(totalFromHeader / effectivePer))
          const safePage = Math.min(Math.max(1, page), pages)
          // API provavelmente já devolveu a fatia [start..end]; usar o que veio
          setAnimais(items)
          setCurrentPage(safePage)
          setTotalPages(pages)
          return
        }

        // se não tem header com total: assumimos array completo (fallback)
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

      // server-side pagination (data + meta)
      setAnimais(parsed.items || [])
      const current = parsed.currentPage ?? page
      const last = parsed.lastPage ?? null

      // se meta.last_page não existir, mas totalFromHeader existir -> calcular last
      if (last === null && totalFromHeader !== null) {
        const pages = Math.max(1, Math.ceil(totalFromHeader / effectivePer))
        setCurrentPage(current)
        setTotalPages(pages)
      } else {
        setCurrentPage(current)
        setTotalPages(last)
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // silencioso
      } else {
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

  // carregamento inicial apenas no mount (reload)
  useEffect(() => {
    componentUnmountedRef.current = false
    void loadPage(1)
    return () => {
      componentUnmountedRef.current = true
      prefetchControllerRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reset filters apenas altera controles — dispara fetch e reseta paginação
  const resetFilters = () => {
    setTipoAnimal("all")
    setSexo("all")
    setAgeRange("any")
    setFullItems(null)
    setTotalPages(null)
    setCurrentPage(1)
    void loadPage(1)
  }

  // PageSizeSelect usando shadcn Select — altera perPage e recarrega pagina 1 (aplicando filtros)
  function PageSizeSelect() {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Linhas por página:</span>

        <Select value={String(perPage)} onValueChange={(v) => {
          const newPer = Number(v)
          setPerPage(newPer)
          setFullItems(null) // força recarregar do servidor / re-paginar
          setTotalPages(null)
          setCurrentPage(1)
          // chama loadPage passando perArg para garantir uso imediato do novo perPage
          void loadPage(1, newPer)
        }}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-auto">
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Renderiza botões de paginação com Badges para página atual, responsivo e com jump-to
  function PaginationControls() {
    // quando total desconhecido -> versão compacta + PageSizeSelect
    if (totalPages === null) {
      return (
        <div className="w-full flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <PageSizeSelect />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => { setCurrentPage(1); void loadPage(1) }} disabled={currentPage <= 1 || loading}>Primeira</Button>
            <Button variant="outline" onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); void loadPage(p) }} disabled={currentPage <= 1 || loading}>Anterior</Button>
            <Badge variant="secondary">Página {currentPage}</Badge>
            <Button variant="outline" onClick={() => { const p = currentPage + 1; setCurrentPage(p); void loadPage(p) }} disabled={loading}>Próxima</Button>
          </div>
        </div>
      )
    }

    const total = totalPages
    const current = currentPage
    const windowSize = 2
    const buttons: (number | "ellipsis")[] = []
    const left = Math.max(2, current - windowSize)
    const right = Math.min(total - 1, current + windowSize)

    buttons.push(1)
    if (left > 2) buttons.push("ellipsis")
    for (let p = left; p <= right; p++) buttons.push(p)
    if (right < total - 1) buttons.push("ellipsis")
    if (total > 1) buttons.push(total)

    // limite para não gerar milhares de options no select
    const JUMP_SELECT_LIMIT = 500

    return (
      <div className="w-full flex flex-col sm:flex-row items-center gap-3">
        {/* esquerda: seletor de tamanho */}
        <div className="flex items-center gap-3">
          <PageSizeSelect />
        </div>

        {/* centro: paginação (full em sm+, compact em xs) */}
        <div className="flex-1 flex justify-center">
          {/* full pagination para telas sm+ */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => { setCurrentPage(1); void loadPage(1) }} disabled={current <= 1 || loading}>Primeira</Button>
            <Button variant="outline" onClick={() => { const p = Math.max(1, current - 1); setCurrentPage(p); void loadPage(p) }} disabled={current <= 1 || loading}>Anterior</Button>

            {buttons.map((b, idx) =>
              b === "ellipsis" ? (
                <span key={`e-${idx}`} className="px-2 text-sm text-muted-foreground">…</span>
              ) : (
                <div key={b} className="flex">
                  {b === current ? (
                    <Badge className="px-3 py-1">{b}</Badge>
                  ) : (
                    <Button variant="ghost" onClick={() => { setCurrentPage(Number(b)); void loadPage(Number(b)) }} disabled={loading}>{b}</Button>
                  )}
                </div>
              )
            )}

            <Button variant="outline" onClick={() => { const p = Math.min(total, current + 1); setCurrentPage(p); void loadPage(p) }} disabled={current >= total || loading}>Próxima</Button>
            <Button variant="outline" onClick={() => { setCurrentPage(total); void loadPage(total) }} disabled={current >= total || loading}>Última</Button>
          </div>

          {/* compact pagination para xs */}
          <div className="flex sm:hidden items-center gap-2">
            <Button variant="outline" onClick={() => { const p = Math.max(1, current - 1); setCurrentPage(p); void loadPage(p) }} disabled={current <= 1 || loading}>Anterior</Button>
            <Badge variant="secondary">Página {current} de {total}</Badge>
            <Button variant="outline" onClick={() => { const p = Math.min(total, current + 1); setCurrentPage(p); void loadPage(p) }} disabled={current >= total || loading}>Próxima</Button>
          </div>
        </div>

        {/* direita: jump-to select (sm+) com fallback para input quando muitas páginas */}
        <div className="hidden sm:flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Ir para</label>

          {total <= JUMP_SELECT_LIMIT ? (
            <Select value={String(current)} onValueChange={(v) => { const p = Number(v); setCurrentPage(p); void loadPage(p) }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
                  <SelectItem key={p} value={String(p)}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={total}
                value={current}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1
                  const target = Math.min(Math.max(1, Math.floor(v)), total)
                  setCurrentPage(target)
                }}
                className="w-20 px-2 py-1 border rounded"
              />
              <Button variant="ghost" onClick={() => { void loadPage(current) }}>Ir</Button>
            </div>
          )}

          <span className="text-sm text-muted-foreground">de {total}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
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

          {/* filtros */}
          <div className="mb-6 flex flex-col md:flex-row gap-3 items-start md:items-end justify-between">
            <div className="flex gap-3 w-full md:w-auto">
              <div>
                <label className="block text-sm mb-1">Tipo</label>
                <Select onValueChange={(v) => setTipoAnimal(v)} value={tipoAnimal}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cao">Cão</SelectItem>
                    <SelectItem value="gato">Gato</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm mb-1">Gênero</label>
                <Select onValueChange={(v) => setSexo(v)} value={sexo}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="femea">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm mb-1">Idade</label>
                <Select onValueChange={(v) => setAgeRange(v as AgeRangeKey)} value={ageRange}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="0_1">Até 1 ano</SelectItem>
                    <SelectItem value="1_3">1 - 3 anos</SelectItem>
                    <SelectItem value="3_8">3 - 8 anos</SelectItem>
                    <SelectItem value="8_plus">8+ anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetFilters}>Limpar</Button>
              <Button onClick={() => { setFullItems(null); setTotalPages(null); setCurrentPage(1); void loadPage(1) }}>Aplicar</Button>
            </div>
          </div>

          {/* lista */}
          {animais.length === 0 && !loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">Nenhum animal disponível para adoção no momento.</p>
              <Button asChild><Link href="/doar-pet">Cadastrar Animal</Link></Button>
            </div>
          ) : (
            <>
              <section key={`page-${currentPage}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {animais.map((animal) => (
                  <AnimalCard key={animal.id} animal={animal} />
                ))}
              </section>

              <div className="mt-6 flex flex-col items-center gap-3">
                {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                {backgroundLoading && <p className="text-sm text-muted-foreground">Prefetching das próximas páginas em background...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                <PaginationControls />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
