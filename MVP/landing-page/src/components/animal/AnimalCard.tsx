// components/animal/AnimalCard.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Animal } from "@/types"
import { calcularIdade } from "@/lib/animal-utils"

interface AnimalCardProps {
  animal: Animal
  onShowDetails: () => void
}

export function AnimalCard({ animal, onShowDetails }: AnimalCardProps) {
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
          {animal.tamanho && <Badge variant="default" className="capitalize">{animal.tamanho}</Badge>}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{animal.nome}</CardTitle>
          <Badge variant="outline" className="capitalize shrink-0 dark:text-accent text-primary">{animal.sexo}</Badge>
        </div>
        <CardDescription className="capitalize">{animal.tipo_animal}</CardDescription>
      </CardHeader>

      <CardContent className="pb-3 space-y-1 text-sm text-muted-foreground">
        <p>{calcularIdade(animal.data_nascimento)}</p>
        {animal.nivel_energia && <p className="capitalize">Energia: {animal.nivel_energia}</p>}
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button className="w-full" onClick={onShowDetails}>
          Ver Detalhes
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Cadastrado em {new Date(animal.created_at).toLocaleDateString("pt-BR")}
        </p>
      </CardFooter>
    </Card>
  )
}