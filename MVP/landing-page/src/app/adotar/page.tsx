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
  const storageUrl = process.env.NEXT_PUBLIC_API_URL + "/imagens" || "http://127.0.0.1:8000/api/imagens/"
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
          <Link href={`/adotar/${animal.id}`}>Ver Detalhes</Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Cadastrado em {new Date(animal.created_at).toLocaleDateString("pt-BR")}
        </p>
      </CardFooter>
    </Card>
  )
}

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
  const perPage = 50

  // Se API retornar array completo, armazenamos e paginamos no client
  const [fullItems, setFullItems] = useState<Animal[] | null>(null)

  // filtros (alterar não dispara fetch automaticamente)
  const [tipoAnimal, setTipoAnimal] = useState<string>("all")
  const [sexo, setSexo] = useState<string>("all")
  const [ageRange, setAgeRange] = useState<AgeRangeKey>("any")

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

  const prefetchControllerRef = useRef<AbortController | null>(null)
  const componentUnmountedRef = useRef(false)

  /**
   * Constrói a URL da API com base no estado atual dos filtros e da página.
   * Envia 'filter', 'sort' e 'range' como strings JSON, conforme esperado pelo Trait PHP.
   */
  const buildPageUrl = useCallback((page: number) => {
    const start = (page - 1) * perPage
    const end = page * perPage - 1

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
      // Supondo que ageRangeToBirthdateRange exista e retorne { from: string, to: string }
      const { from, to } = ageRangeToBirthdateRange(ageRange)
      if (from) {
        filterObj.data_nascimento_from = from // Corresponde a 'data_nascimento_from$' no PHP
      }
      if (to) {
        filterObj.data_nascimento_to = to // Corresponde a 'data_nascimento_to$' no PHP
      }
    }

    // 2. Parâmetros da URL
    const params = new URLSearchParams()
    // 'range' é uma string literal '[start,end]'
    params.set('range', `[${start},${end}]`)
    // 'filter' é uma string JSON
    params.set('filter', JSON.stringify(filterObj))
    // 'sort' é uma string JSON
    params.set('sort', JSON.stringify(['id', 'ASC'])) // Exemplo de ordenação

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

  // Carrega página (invocado ao clicar "Aplicar" ou no mount). Faz prefetch das próximas páginas em background se aplicável.
  const loadPage = useCallback(async (page: number) => {
    // cancelar prefetch anterior se houver
    prefetchControllerRef.current?.abort()
    prefetchControllerRef.current = new AbortController()
    const prefetchSignal = prefetchControllerRef.current.signal

    setLoading(true)
    setError(null)
    setBackgroundLoading(false)

    try {
      // Se já temos fullItems (API devolveu array completo anteriormente), paginar localmente
      if (fullItems) {
        const start = (page - 1) * perPage
        const pageItems = fullItems.slice(start, start + perPage)
        setAnimais(pageItems)
        setCurrentPage(page)
        setTotalPages(Math.ceil(fullItems.length / perPage))
        return
      }

      const url = buildPageUrl(page)
      const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal: prefetchSignal })
      const parsed = await parseResponse(res)

      if (parsed.mode === "none") {
        // API retornou array completo; armazenar e paginar localmente
        setFullItems(parsed.items)
        const start = (page - 1) * perPage
        const pageItems = parsed.items.slice(start, start + perPage)
        setAnimais(pageItems)
        setTotalPages(Math.ceil(parsed.items.length / perPage))
        setCurrentPage(page)
        return
      }

      // server-side pages
      setAnimais(parsed.items || [])
      const current = parsed.currentPage ?? page
      const last = parsed.lastPage ?? null
      setCurrentPage(current)
      setTotalPages(last)

      // prefetch em background quando soubermos lastPage maior que current
      if (last && last > current) {
        // spawn background prefetch (não bloqueia o retorno)
        setBackgroundLoading(true)
        void (async () => {
          try {
            // cria novo controller local para esta sequência background (link ao prefetchControllerRef)
            const controller = prefetchControllerRef.current
            for (let p = current + 1; p <= last; p++) {
              if (componentUnmountedRef.current) break
              if (controller?.signal.aborted) break
              // delay curto para evitar requisitar tudo de uma vez
              await delay(200)
              const pageUrl = buildPageUrl(p)
              const r = await fetch(pageUrl, { cache: "no-store", headers: { Accept: "application/json" }, signal: controller?.signal })
              const parsedPage = await parseResponse(r)
              if (componentUnmountedRef.current) break
              if (controller?.signal.aborted) break
              if (parsedPage.items && parsedPage.items.length > 0) {
                // quando prefetch é concluído com sucesso, se estivermos usando fullItems não faz sentido,
                // mas aqui concatenamos no estado fullItems-friendly: se fullItems ainda for null, vamos acumulando no state de fullItems temporário
                setFullItems((prev) => {
                  if (prev) return [...prev, ...parsedPage.items]
                  // inicializa com página atual + prefeteched pages: juntar animais já mostrados + parsedPage.items
                  // Observação: animais contém a página atual; portanto criamos uma nova array combinando animais já carregados e parsedPage.items
                  const aggregated = [...animais, ...parsedPage.items]
                  return aggregated
                })
              }
            }
          } catch (e) {
            if ((e as any)?.name === "AbortError") {
              // cancelado — não logar como erro
            } else {
              console.error("Erro no prefetch:", e)
            }
          } finally {
            if (!componentUnmountedRef.current) setBackgroundLoading(false)
          }
        })()
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // fetch cancelado — não setar erro visível
      } else {
        console.error("Erro ao carregar animais:", err)
        setError(err.message || "Erro ao carregar animais")
        setAnimais([])
        setTotalPages(null)
      }
    } finally {
      if (!componentUnmountedRef.current) setLoading(false)
    }
  }, [buildPageUrl, parseResponse, perPage, fullItems, animais])

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

  // reset filters apenas altera controles — NÃO dispara fetch automaticamente
  const resetFilters = () => {
    setTipoAnimal("all")
    setSexo("all")
    setAgeRange("any")
  }

  // Renderiza botões de paginação com Badges para página atual
  function PaginationControls() {
    if (totalPages === null) {
      // total desconhecido -> Prev / Next simples, atual mostra como Badge
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1 || loading}>Anterior</Button>
          <Badge variant="secondary">Página {currentPage}</Badge>
          <Button variant="outline" onClick={() => loadPage(currentPage + 1)} disabled={loading}>Próxima</Button>
        </div>
      )
    }

    const total = totalPages
    const current = currentPage
    const buttons: (number | "ellipsis")[] = []
    const windowSize = 2
    const left = Math.max(2, current - windowSize)
    const right = Math.min(total - 1, current + windowSize)

    buttons.push(1)
    if (left > 2) buttons.push("ellipsis")
    for (let p = left; p <= right; p++) buttons.push(p)
    if (right < total - 1) buttons.push("ellipsis")
    if (total > 1) buttons.push(total)

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" onClick={() => loadPage(Math.max(1, current - 1))} disabled={current <= 1 || loading}>Anterior</Button>

        {buttons.map((b, idx) =>
          b === "ellipsis" ? (
            <span key={`e-${idx}`} className="px-2 text-sm text-muted-foreground">…</span>
          ) : (
            <div key={b} className="flex">
              {b === current ? (
                <Badge className="px-3 py-1">{b}</Badge>
              ) : (
                <Button variant="ghost" onClick={() => loadPage(b)} disabled={loading}>{b}</Button>
              )}
            </div>
          )
        )}

        <Button variant="outline" onClick={() => loadPage(Math.min(total, current + 1))} disabled={current >= total || loading}>Próxima</Button>
        <span className="text-sm text-muted-foreground ml-2">Página {current} de {total}</span>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">Animais Para Adoção</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encontre seu novo melhor amigo. Filtre por tipo, gênero e idade.
            </p>
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
              <Button onClick={() => loadPage(1)}>Aplicar</Button>
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
