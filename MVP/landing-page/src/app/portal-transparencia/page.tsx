"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Link from "next/link"
import { Download, FileText, Search, ChevronLeft, ChevronRight, Folder } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

// ------------------------------------------------
// TIPOS
// ------------------------------------------------

type Transacao = {
  id: number
  tipo: "receita" | "despesa"
  valor: number
  data: string
  categoria: string
  situacao: string
}

type Documento = {
  id: number
  titulo: string
  categoria?: string | null
  descricao?: string | null
  arquivo?: string | null
  tipo?: string | null
  tamanho?: number | null
  nome_original?: string | null
  created_at?: string | null
}

// ------------------------------------------------
// HELPERS
// ------------------------------------------------

// NOVO HELPER: Formatação para Real (R$)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes === 0) return "0 B"
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
}

function yearFromDocument(doc: Documento) {
  if (!doc.created_at) return new Date().getFullYear()
  const d = new Date(doc.created_at)
  if (Number.isNaN(d.getTime())) return new Date().getFullYear()
  return d.getFullYear()
}

// ------------------------------------------------
// COMPONENTES DE AJUDA
// ------------------------------------------------

// Item de Documento Mínimo
function DocItem({ doc }: { doc: Documento }) {
  const api = process.env.NEXT_PUBLIC_API_URL || ""
  const downloadUrl = `${api}/documentos/${doc.id}/download`

  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-transparent min-w-[260px]">
      <div className="shrink-0 h-12 w-12 rounded-md bg-muted/30 dark:bg-muted/20 flex items-center justify-center">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <div className="font-medium">{doc.titulo}</div>
        <div className="text-xs text-muted-foreground">{doc.descricao ?? "Sem descrição"}</div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <a href={downloadUrl} target="_blank" rel="noreferrer" aria-label={`Baixar ${doc.titulo}`}>
          <Button size="sm" variant="ghost" className="p-2">
            <Download className="h-4 w-4" />
          </Button>
        </a>
        <Link href={`/documentos/${doc.id}`} className="text-xs underline text-primary">
          Ver
        </Link>
      </div>
    </div>
  )
}

// Skeleton para loading
function DocItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-transparent min-w-[260px]">
      <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

// Componente do Gráfico de Arrecadações (Receita)
function ReceitaChart({ chartData, chartLoading, isDark, gridColor, textColor, receitaColor }: {
  chartData: any[]
  chartLoading: boolean
  isDark: boolean
  gridColor: string
  textColor: string
  receitaColor: string
}) {
  return (
    <div className="border rounded-xl p-4 shadow-sm bg-card">
      <h3 className="text-center font-semibold mb-2">Arrecadações</h3>

      {chartLoading ? (
        <div className="h-40 bg-muted/30 rounded animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 50,
              bottom: 0,
            }}
          >
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="mes" stroke={textColor} />
            <YAxis stroke={textColor} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                background: isDark ? "#1f1f1f" : "#fff",
                borderRadius: 8,
                border: "1px solid #444",
                color: textColor
              }}
              formatter={(value: number) => [formatCurrency(value), "Receita"]}
            />
            <Line
              type="monotone"
              dataKey="receita"
              stroke={receitaColor}
              strokeWidth={3}
              dot={{ r: 4, fill: receitaColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// Componente do Gráfico de Despesas
function DespesaChart({ chartData, chartLoading, isDark, gridColor, textColor, despesaColor }: {
  chartData: any[]
  chartLoading: boolean
  isDark: boolean
  gridColor: string
  textColor: string
  despesaColor: string
}) {
  return (
    <div className="border rounded-xl p-4 shadow-sm bg-card">
      <h3 className="text-center font-semibold mb-2">Despesas</h3>

      {chartLoading ? (
        <div className="h-40 bg-muted/30 rounded animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 50,
              bottom: 0,
            }}
          >
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="mes" stroke={textColor} />
            <YAxis stroke={textColor} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                background: isDark ? "#1f1f1f" : "#fff",
                borderRadius: 8,
                border: "1px solid #444",
                color: textColor
              }}
              formatter={(value: number) => [formatCurrency(value), "Despesa"]}
            />
            <Line
              type="monotone"
              dataKey="despesa"
              stroke={despesaColor}
              strokeWidth={3}
              dot={{ r: 4, fill: despesaColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------

export default function TransparenciaPage() {
  // Estado e Lógica de Transações/Gráfico
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const { theme } = useTheme()

  // Estado e Lógica de Documentos
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [categoria, setCategoria] = useState<string>("")
  const [page, setPage] = useState(1)
  const perPage = 12
  const searchTimeout = useRef<number | null>(null)

  // 1. Cores do Gráfico (dependem do tema)
  const isDark = theme === "dark"
  const gridColor = isDark ? "#333" : "#e5e7eb"
  const textColor = isDark ? "#e5e7eb" : "#111"
  const receitaColor = "#22c55e" // verde
  const despesaColor = "#ef4444" // vermelho

  // 2. Buscar Dados de Transações
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || ""

    fetch(`${api}/transacoes`)
      .then((r) => r.json())
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res
        setTransacoes(items)
      })
      .finally(() => setChartLoading(false))
  }, [])

  // 3. Agrupar Dados de Transações por mês/ano
  const chartData = useMemo(() => {
    // Validação básica
    if (!transacoes || !Array.isArray(transacoes)) return [];

    const map = new Map<string, { receita: number; despesa: number }>();

    transacoes.forEach((t) => {
      if (t.situacao !== 'concluido') return;

      const dt = new Date(t.data);
      if (isNaN(dt.getTime())) return;

      const key = `${dt.getMonth() + 1}/${dt.getFullYear()}`;

      if (!map.has(key)) {
        map.set(key, { receita: 0, despesa: 0 });
      }

      const valorSeguro = Number(t.valor) || 0;

      const entry = map.get(key)!;

      if (t.tipo === "receita") entry.receita += valorSeguro;
      if (t.tipo === "despesa") entry.despesa += valorSeguro;
    });

    const result = Array.from(map.entries()).map(([mes, valores]) => ({
      mes,
      ...valores,
    }));

    return result.sort((a, b) => {
      const [mesA, anoA] = a.mes.split('/').map(Number);
      const [mesB, anoB] = b.mes.split('/').map(Number);

      if (anoA !== anoB) return anoA - anoB;

      return mesA - mesB;
    });

  }, [transacoes]);

  // 4. Buscar Dados de Documentos
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current)

    searchTimeout.current = window.setTimeout(() => {
      const api = process.env.NEXT_PUBLIC_API_URL || ""
      const params = new URLSearchParams()
      params.set("limit", String(perPage))
      params.set("page", String(page))
      if (query.trim()) params.set("q", query.trim())
      if (categoria) params.set("categoria", categoria)

      fetch(`${api}/documentos?${params.toString()}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text()
            throw new Error(text || "Erro ao buscar documentos")
          }
          return res.json()
        })
        .then((data) => {
          // aceita arrays ou { data: [...] }
          if (Array.isArray(data)) setDocumentos(data)
          else if (Array.isArray(data.data)) setDocumentos(data.data)
          else setDocumentos(data.items ?? data.documentos ?? [])
        })
        .catch((err) => {
          if ((err as any).name !== "AbortError") {
            console.error(err)
            setError("Não foi possível carregar documentos.")
          }
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => {
      controller.abort()
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current)
    }
  }, [page, query, categoria])

  // 5. Agrupar Documentos por ano
  const groups = useMemo(() => {
    const map = new Map<number, Documento[]>()
    documentos.forEach((d) => {
      const y = yearFromDocument(d)
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(d)
    })
    // transformar em array ordenado desc
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, docs]) => ({ year, docs }))
  }, [documentos])

  // Lógica de Renderização do Ano
  const defaultYears = [2025, 2024, 2023, 2022]
  const yearsToRender = groups.length ? groups : defaultYears.map((y) => ({ year: y, docs: [] as Documento[] }))

  return (
    <>
      <main className="min-h-screen pt-20 bg-background">
        {/* Cabeçalho / Charts */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-transparent rounded-md p-2">
            <h2 className="text-center text-lg font-semibold">Prestação de Contas</h2>

            {/* Gráficos de Receita e Despesa */}
            <div className="mt-4 space-y-4">
              <ReceitaChart
                chartData={chartData}
                chartLoading={chartLoading}
                isDark={isDark}
                gridColor={gridColor}
                textColor={textColor}
                receitaColor={receitaColor}
              />
              <DespesaChart
                chartData={chartData}
                chartLoading={chartLoading}
                isDark={isDark}
                gridColor={gridColor}
                textColor={textColor}
                despesaColor={despesaColor}
              />
            </div>
          </div>
        </section>

        {/* Documentos - título */}
        <section className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-xl font-semibold my-6">Documentos</h2>

          {/* Accordion por ano */}
          <Accordion type="single" collapsible className="space-y-4">
            {yearsToRender.map(({ year, docs }) => (
              <AccordionItem key={year} value={String(year)} className="border-t">
                <AccordionTrigger className="flex items-center justify-between py-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md border border-border">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="font-medium">Documentos {year}</div>
                  </div>

                  <div className="text-sm text-muted-foreground">{docs.length ? `${docs.length} documento(s)` : "Nenhum documento"}</div>
                </AccordionTrigger>

                <AccordionContent className="pt-0 pb-6">
                  <div className="border-b my-2" />

                  {loading ? (
                    <div className="flex gap-4 overflow-x-auto py-2">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="min-w-[260px]">
                          <DocItemSkeleton />
                        </div>
                      ))}
                    </div>
                  ) : docs.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto py-2">
                      {docs.map((doc) => (
                        <div key={doc.id} className="min-w-[260px]">
                          <DocItem doc={doc} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-2 text-muted-foreground">Nenhum documento para este ano.</div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </>
  )
}
