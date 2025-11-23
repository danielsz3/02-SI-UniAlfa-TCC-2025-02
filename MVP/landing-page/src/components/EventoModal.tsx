"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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

interface EventoModalProps {
  evento: Evento | null
  open: boolean
  onClose: () => void
}

export default function EventoModal({ evento, open, onClose }: EventoModalProps) {
  if (!evento) return null

  const imagensTratadas =
    evento?.imagens && evento.imagem
      ? [{ id: 999999, caminho: evento.imagem }, ...evento.imagens]
      : evento?.imagens ||
      (evento.imagem ? [{ id: 1, caminho: evento.imagem }] : [])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-primary">
            {evento.titulo}
          </DialogTitle>

          <DialogDescription className="text-sm mt-1">
            Evento de{" "}
            <strong>
              {new Date(evento.data_inicio).toLocaleDateString("pt-BR")}
            </strong>{" "}
            até{" "}
            <strong>
              {new Date(evento.data_fim).toLocaleDateString("pt-BR")}
            </strong>
          </DialogDescription>
        </DialogHeader>

        {/* IMAGENS */}
        <div className="w-full h-[300px] md:h-[350px] mt-4">
          <ImageCarousel images={imagensTratadas} />
        </div>

        {/* DESCRIÇÃO */}
        <div className="p-6 pt-4 text-muted-foreground text-sm leading-relaxed">
          {evento.descricao}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-6 pt-0">
          <Button
            variant="outline"
            onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
