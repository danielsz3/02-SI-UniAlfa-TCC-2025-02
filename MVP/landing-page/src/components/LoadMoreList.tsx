"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"

interface LoadMoreListProps {
  url?: string
  localData?: any[]
  step?: number
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
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

  const didLoadInitialRef = useRef(false)
  const currentSourceRef = useRef<string>("")

  const loadLocalData = () => {
    const end = start + step
    const newItems = localData!.slice(start, end)

    setItems(prev => [...prev, ...newItems])
    setStart(end)

    if (end >= localData!.length) {
      setHasMore(false)
    }
  }

  const loadApiData = async () => {
    setLoading(true)

    try {
      const end = start + step

      let data: any[] = []
      let totalCount = 0

      if (fetchData) {
        const result = await fetchData(start, end - 1)
        data = result.data
        totalCount = result.total
      } else {
        const response = await fetch(`${url}?range=[${start},${end - 1}]`)
        data = await response.json()

        const contentRange = response.headers.get("Content-Range")
        totalCount = contentRange ? Number(contentRange.split("/")[1]) : start + data.length
      }

      setItems(prev => [...prev, ...data])
      setStart(prev => prev + data.length)
      setTotal(totalCount)

      if (data.length < step || start + data.length >= totalCount) {
        setHasMore(false)
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e)
      setHasMore(false)
    }

    setLoading(false)
  }

  const loadData = () => {
    if (loading || !hasMore) return

    if (localData) loadLocalData()
    else loadApiData()
  }

  useEffect(() => {
    const newSource = url || (fetchData ? "fetchData" : "localData")

    // Só reseta se a fonte de dados mudou
    if (currentSourceRef.current !== newSource) {
      currentSourceRef.current = newSource
      setItems([])
      setStart(0)
      setHasMore(true)
      setTotal(localData ? localData.length : 0)
      didLoadInitialRef.current = false
    }
  }, [localData, url, fetchData])

  useEffect(() => {
    if (!didLoadInitialRef.current && items.length === 0) {
      didLoadInitialRef.current = true
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  const defaultClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

  return (
    <div className="space-y-6">
      <div className={className ?? defaultClassName}>
        {items.map((item, i) => {
          const uniqueKey = item?.id
            ? `item-${item.id}`
            : item?.slug
              ? `slug-${item.slug}`
              : `index-${i}`

          return <div key={uniqueKey}>{renderItem(item, i)}</div>
        })}
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

      {total > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {items.length} de {total} {total === 1 ? "item" : "itens"}
        </p>
      )}
    </div>
  )
}
