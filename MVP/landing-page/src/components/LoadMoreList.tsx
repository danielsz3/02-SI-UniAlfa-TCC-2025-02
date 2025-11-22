"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface LoadMoreListProps {
    url: string // ex: "/api/documentos"
    step?: number
    renderItem: (item: any, index: number) => React.ReactNode
}

export default function LoadMoreList({
    url,
    step = 10,
    renderItem,
}: LoadMoreListProps) {
    const [items, setItems] = useState<any[]>([])
    const [start, setStart] = useState(0)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const loadData = async () => {
        setLoading(true)

        const end = start + step - 1

        const response = await fetch(`${url}?range=[${start},${end}]`)
        const data = await response.json()

        const contentRange = response.headers.get("Content-Range")
        // Exemplo: "items 0-9/57"
        const total = contentRange ? Number(contentRange.split("/")[1]) : 0

        setItems(prev => [...prev, ...data])
        setStart(prev => prev + step)

        if (start + step >= total) {
            setHasMore(false)
        }

        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item, i) => renderItem(item, i))}
            </div>

            {hasMore && (
                <Button
                    onClick={loadData}
                    disabled={loading}
                    className="w-full mt-4"
                    variant="outline"
                >
                    {loading ? "Carregando..." : "Ver mais"}
                </Button>
            )}
        </div>
    )
}
