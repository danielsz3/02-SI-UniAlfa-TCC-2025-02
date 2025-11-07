"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navbar } from "@/components/navbar"


// Types
type Evento = {
  id: number
  titulo: string
  manchete: string
  imagem?: string
  data: string
}

type Feedback = {
  id: number
  usuario: string
  avatar?: string
  comentario: string
  avaliacao: number
  data: string
}

// Subcomponents
function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-br from-primary/10 via-primary/5 to-background">
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
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
      </CardContent>
    </Card>
  )
}

function EventoCard({ evento }: { evento: Evento }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-muted relative">
        {evento.imagem ? (
          <img
            src={evento.imagem}
            alt={evento.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{evento.titulo}</h3>
        <p className="text-sm text-muted-foreground mb-2">{evento.manchete}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(evento.data).toLocaleDateString('pt-BR')}
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

function FeedbackCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted"
            }`}
        />
      ))}
    </div>
  )
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Avatar>
          <AvatarImage src={feedback.avatar} alt={feedback.usuario} />
          <AvatarFallback>
            {feedback.usuario[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{feedback.usuario}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(feedback.data).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
        {feedback.comentario}
      </p>
      <StarRating rating={feedback.avaliacao} />
    </Card>
  )
}

function FeedbacksSection({ feedbacks, loading }: { feedbacks: Feedback[]; loading: boolean }) {
  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold mb-8">Feedbacks</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <FeedbackCardSkeleton key={i} />
            ))}
          </div>
        ) : feedbacks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {feedbacks.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            Nenhum feedback disponível
          </p>
        )}
      </div>
    </section>
  )
}

// Main Component
export default function Home() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventosRes, feedbacksRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/eventos?limit=4`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedbacks?limit=4`)
        ])

        if (eventosRes.ok) {
          const eventosData = await eventosRes.json()
          setEventos(eventosData)
        }

        if (feedbacksRes.ok) {
          const feedbacksData = await feedbacksRes.json()
          setFeedbacks(feedbacksData)
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
      <FeedbacksSection feedbacks={feedbacks} loading={loading} />
    </>
  )
}
