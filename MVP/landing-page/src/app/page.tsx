"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ImageCarousel from "@/components/ImageCarousel"
import { Imagens } from "@/types"

type Evento = {
  id: number
  titulo: string
  imagem?: string
  descricao: string
  data_inicio: string
  data_fim: string
  imagens: Imagens[]
}

function HeroSection() {
  return (
    <section className="w-full bg-linear-to-br from-primary/10 via-primary/5 to-background">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Encontre seu novo melhor amigo
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Conectamos pets que precisam de um lar com pessoas que querem amar.
            Adote, doe e transforme vidas.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/adotar">Adotar um Pet</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/doar-pet">Doar um Pet</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function EventoCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse mt-2" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
      </CardContent>
    </Card>
  )
}

function EventoCard({ evento }: { evento: Evento }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-50 bg-muted">
        {evento.imagem ? (
          <ImageCarousel
            className="h-full"
            images={evento.imagens ? [{ id: evento.imagens.length + 1, caminho: evento.imagem }, ...evento.imagens] : [{ id: 0, caminho: evento.imagem }]}
            alt={evento.titulo} variant="minimal"
            autoPlay
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
      </div>
      <CardContent className="p-4 mt-2">
        <h3 className="font-semibold text-md md:text-lg mb-1">{evento.titulo}</h3>
        <p className="text-xs font-bold text-primary mt-2">
          de {new Date(evento.data_inicio).toLocaleDateString('pt-BR')} até {new Date(evento.data_fim).toLocaleDateString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  )
}

function EventosSection({ eventos, loading }: { eventos: Evento[]; loading: boolean }) {
  return (
    <section className="w-full py-16 bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold mb-8">Eventos</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <EventoCardSkeleton key={i} />
            ))}
          </div>
        ) : eventos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventos.map((evento) => (
              <EventoCard key={evento.id} evento={evento} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            Nenhum evento disponível
          </p>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/eventos?limit=4`),
        ])

        if (eventosRes.ok) {
          const eventosData = await eventosRes.json()
          setEventos(eventosData)
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <>
      <HeroSection />
      <EventosSection eventos={eventos} loading={loading} />
    </>
  )
}
