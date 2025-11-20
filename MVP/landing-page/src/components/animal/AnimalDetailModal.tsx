// components/animal/AnimalDetailModal.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Animal } from "@/types"
import { calcularIdade } from "@/lib/animal-utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { Calendar, Heart, Ruler, Zap, Loader2, X, HeartIcon } from "lucide-react"

import ImageCarousel from "@/components/ImageCarousel"

interface AnimalDetailModalProps {
    initialData: Animal | null
    onClose: () => void
    buttonAdotar: boolean
    carousel?: boolean
}

async function fetchAnimal(id: number) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/animais/${id}`, {
            cache: "no-store",
        })
        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText || `Erro ${res.status} ao buscar animal`)
        }
        return (await res.json()) as Animal
    } catch (err: any) {
        console.error("Falha ao buscar animal:", err)
        throw err
    }
}

export function AnimalDetailModal({ initialData, onClose, buttonAdotar, carousel = true }: AnimalDetailModalProps) {
    const [animal, setAnimal] = useState<Animal | null>(initialData)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (initialData) {
            setAnimal(initialData)
            setError(null)
            const needsFetch = !initialData.descricao

            if (needsFetch) {
                const loadFullDetails = async () => {
                    setLoadingDetails(true)
                    try {
                        const fullData = await fetchAnimal(initialData.id)
                        setAnimal(fullData)
                    } catch (err: any) {
                        setError("Não foi possível carregar os detalhes completos.")
                    } finally {
                        setLoadingDetails(false)
                    }
                }
                void loadFullDetails()
            } else {
                setLoadingDetails(false)
            }
        } else {
            setAnimal(null)
            setError(null)
            setLoadingDetails(false)
        }
    }, [initialData])

    const isOpen = !!initialData

    const renderContent = () => {
        if (!animal) return null

        return (
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-6 md:gap-8">
                {/* Coluna 1: Imagem */}
                {carousel && (
                    <div className="rounded-lg overflow-hidden  sm:h-full min-h-[55vh]">
                        <ImageCarousel images={animal.imagens} alt={animal.nome} />
                    </div>
                )}

                {/* Coluna 2: Informações */}
                <div className="space-y-6">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-2">
                            <DialogTitle className="text-4xl font-bold">{animal.nome}</DialogTitle>
                            <Badge
                                className="capitalize text-base px-3 py-1 shrink-0"
                            >
                                {animal.sexo}
                            </Badge>
                        </div>
                        <p className="text-xl text-muted-foreground capitalize text-left">
                            {animal.tipo_animal}
                        </p>
                    </DialogHeader>

                    <Separator />

                    {/* Grid de Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="flex items-center gap-3 p-4 px-3">
                            <Calendar className="h-5 w-5 text-primary shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Idade</p>
                                <p className="font-semibold">
                                    {calcularIdade(animal.data_nascimento)}
                                </p>
                            </div>
                        </Card>

                        {animal.tamanho && (
                            <Card className="flex items-center gap-3 p-4 px-3">
                                <Ruler className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Tamanho</p>
                                    <p className="font-semibold capitalize">{animal.tamanho}</p>
                                </div>
                            </Card>
                        )}

                        {animal.nivel_energia && (
                            <Card className="flex items-center gap-3 p-4 px-3">
                                <Zap className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Energia</p>
                                    <p className="font-semibold capitalize">
                                        {animal.nivel_energia}
                                    </p>
                                </div>
                            </Card>
                        )}

                        {typeof animal.castrado !== "undefined" && (
                            <Card className="flex items-center gap-3 p-4 px-3">
                                <Heart className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Castrado</p>
                                    <p className="font-semibold">
                                        {animal.castrado ? "Sim" : "Não"}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Seção "Sobre" */}
                    {(animal.descricao || loadingDetails) && (
                        <>
                            <Separator />
                            <div>
                                <h2 className="text-xl font-semibold mb-3">
                                    Sobre {animal.nome}
                                </h2>
                                {loadingDetails ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Carregando detalhes...</span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {animal.descricao}
                                        </p>
                                        {animal.situacao == 'adotado' && (
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mt-4">
                                                Este animal já foi adotado.
                                            </p>
                                        )}
                                        {animal.id_lar_temporario != 0 && (
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mt-4">
                                                Este animal no lar temporário de {animal.lar_temporario?.nome}.
                                            </p>
                                        )}        
                                        {animal.fica_usuario == 0 && (
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mt-4">
                                                Este animal está com o dono atualmente.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-destructive text-center -mt-2">
                            {error}
                        </p>
                    )}

                    {buttonAdotar && (
                        <Button asChild size="lg" className="w-full">
                            <Link href={`/adotar/form?animal_id=${animal.id}`}>
                                Quero Adotar {animal.nome}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => !open && onClose()}
                modal
            >
                <DialogContent
                    className="max-h-[90vh] min-w-[90vw] overflow-y-auto p-6 gap-0 "
                >
                    {renderContent()}
                </DialogContent>
            </Dialog>
        </>
    )
}
