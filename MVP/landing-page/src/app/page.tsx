"use client"

import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ImageCarousel from "@/components/ImageCarousel"
import Ballpit from "@/components/Ballpit"
import LoadMoreList from "@/components/LoadMoreList"

import EventoModal from "@/components/EventoModal"
import { Imagens } from "@/types"

// =============================
// TYPES
// =============================

type Evento = {
  id: number
  titulo: string
  imagem?: string
  descricao: string
  data_inicio: string
  data_fim: string
  imagens: Imagens[]
}

// =============================
// HERO SECTION
// =============================

function HeroSection() {
  return (
    <section className="relative w-full bg-linear-to-br from-primary/10 via-primary/5 to-background overflow-hidden min-h-[500px] flex items-center">
      <div className="absolute inset-0 w-full h-full z-0">
        <Ballpit
          count={50}
          gravity={0.045}
          friction={0.9975}
          wallBounce={1}
          followCursor={false}
          minSize={1.6}
          maxSize={1.1}
          lightIntensity={50}
          colors={["#0367A6", "#54DBF7", "#F2F1F0", "#049DBF", "#3DD1F2"]}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-24 pointer-events-none">
        <div className="flex flex-col items-center text-center space-y-6 pointer-events-auto">
          <div className="flex flex-col items-center text-center space-y-6 pointer-events-auto bg-background/30 dark:bg-background/50 backdrop-blur-sm p-8 rounded-2xl border border-white/20 shadow-xl -mt-10">
            <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white tracking-tight">
              Encontre seu novo melhor amigo
            </h1>

            <p className="text-lg md:text-2xl text-black dark:text-accent font-semibold max-w-2xl">
              Conectamos pets que precisam de um lar com pessoas que querem amar.
              Adote, doe e transforme vidas.
            </p>

            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/adotar">Adotar um Pet</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover:text-white dark:hover:text-black dark:hover:bg-foreground dark:bg-accent-foreground"
                asChild
              >
                <Link href="/doar-pet">Doar um Pet</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =============================
// CARD DO EVENTO (AGORA ABRE MODAL)
// =============================

function EventoCard({
  evento,
  onClick,
}: {
  evento: Evento
  onClick: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="h-50 bg-muted">
        {evento.imagem ? (
          <ImageCarousel
            className="h-full"
            images={
              evento.imagens
                ? [{ id: evento.imagens.length + 1, caminho: evento.imagem }, ...evento.imagens]
                : [{ id: 0, caminho: evento.imagem }]
            }
            alt={evento.titulo}
            variant="minimal"
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
          de {new Date(evento.data_inicio).toLocaleDateString("pt-BR")} até{" "}
          {new Date(evento.data_fim).toLocaleDateString("pt-BR")}
        </p>
      </CardContent>
    </Card>
  )
}

// =============================
// PAGE: HOME
// =============================

export default function Home() {
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <HeroSection />

      {/* MODAL */}
      <EventoModal
        evento={eventoSelecionado}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* LISTA DE EVENTOS */}
      <section className="w-full py-16 bg-background">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-8">Eventos</h2>

          <LoadMoreList
            url={`${process.env.NEXT_PUBLIC_API_URL}/eventos`}
            step={6}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            renderItem={(evento: Evento, index) => (
              <EventoCard
                key={evento.id ?? index}
                evento={evento}
                onClick={() => {
                  setEventoSelecionado(evento)
                  setModalOpen(true)
                }}
              />
            )}
          />
        </div>
      </section>
    </>
  )
}
