"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface LoadMoreListProps {
  // Para dados da API
  url?: string
  
  // Para dados locais
  localData?: any[]
  
  step?: number
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
  
  // Função customizada para buscar dados (opcional)
  fetchData?: (start: number, end: number) => Promise<{ data: any[]; total: number }>
}

export default function LoadMoreList({
  url,
  localData,
  step = 10,
  renderItem,
  className,
  fetchData,
}: LoadMoreListProps) {
  const [items, setItems] = useState<any[]>([])
  const [start, setStart] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  // Modo local: carrega dados locais paginados
  const loadLocalData = () => {
    if (!localData) return

    const end = start + step
    const newItems = localData.slice(start, end)

    setItems((prev) => [...prev, ...newItems])
    setStart(end)
    setTotal(localData.length)

    if (end >= localData.length) {
      setHasMore(false)
    }
  }

  // Modo API: busca dados da API
  const loadApiData = async () => {
    if (!url && !fetchData) return

    setLoading(true)

    try {
      const end = start + step - 1

      let data: any[] = []
      let totalCount = 0

      if (fetchData) {
        // Usa função customizada
        const result = await fetchData(start, end)
        data = result.data
        totalCount = result.total
      } else if (url) {
        // Usa URL padrão
        const response = await fetch(`${url}?range=[${start},${end}]`)
        data = await response.json()

        const contentRange = response.headers.get("Content-Range")
        // "items 0-9/57"
        totalCount = contentRange
          ? Number(contentRange.split("/")[1])
          : start + data.length // fallback melhor que só data.length
      }

      setItems((prev) => [...prev, ...data])
      setStart((prev) => prev + step)
      setTotal(totalCount)

      // usa start + data.length para não depender de totalCount perfeito
      const loadedSoFar = start + data.length
      if (loadedSoFar >= totalCount || data.length < step) {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const loadData = () => {
    if (localData) {
      loadLocalData()
    } else {
      loadApiData()
    }
  }

  // Reset quando mudar os dados locais ou URL
  useEffect(() => {
    setItems([])
    setStart(0)
    setHasMore(true)
    setTotal(localData ? localData.length : 0)
  }, [localData, url])

  // Carrega primeira página
  useEffect(() => {
    // só chama no primeiro render / após reset
    if (items.length === 0 && hasMore) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length === 0, hasMore])

  // Mostra loading inicial apenas para API
  if (!localData && loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  // Sem itens
  if (items.length === 0 && !loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-muted-foreground">Nenhum item encontrado</div>
      </div>
    )
  }

  // Limitamos o layout padrão a no máximo 3 colunas.
  const defaultClassName =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

  return (
    <div className="space-y-6">
      <div className={className ?? defaultClassName}>
        {items.map((item, i) => renderItem(item, i))}
      </div>

      {hasMore && (
        <Button
          onClick={loadData}
          disabled={loading}
          className="w-full mt-2"
          variant="outline"
        >
          {loading ? "Carregando..." : "Ver mais"}
        </Button>
      )}

      {/* Contador ajustado */}
      {total > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {items.length} de {total} {total === 1 ? "item" : "itens"}
        </p>
      )}
    </div>
  )
}
