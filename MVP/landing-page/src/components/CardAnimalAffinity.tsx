'use client';

import type { AnimalAffinity } from '@/types'; // Importe seus tipos
import { Badge } from './ui/badge';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Verifique o caminho
import ImageCarousel from './ImageCarousel';
import { calcularIdade } from '@/lib/animal-utils';
import { Button } from './ui/button';
import { Heart, Info, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  animal_afinidade: AnimalAffinity;
  onStatusChangeSuccess: (animalId: number) => void;
}

const mudarStatus = async (status: string, animal_id: number, onSuccess: (animalId: number) => void) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/match-afinidades/mudar-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          status,
          animal_id,
          usuario_id: JSON.parse(localStorage.getItem("user") || '{}').id,
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Falha ao criar o animal")
    }
    const data = await response.json();
    toast.success(`Requisição realizada com sucesso!`);
    onSuccess(animal_id);
    return data;
  } catch (error) {
    toast.error(`Erro ao realizar requisição: ${error}`);
    return null;
  }
};

export default function CardAnimalAffinity({ animal_afinidade, onStatusChangeSuccess }: Props) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{animal_afinidade.animal.nome}</CardTitle>
        <p>{calcularIdade(animal_afinidade.animal.data_nascimento)}</p>
        <Badge className='capitalize absolute top-7 right-7'>{animal_afinidade.animal.sexo}</Badge>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative"> {/* p-0 e relative */}
        <div className="w-full h-[45vh] md:h-[35vh]  overflow-hidden rounded-t-lg">
          <ImageCarousel
            images={animal_afinidade.animal.imagens}
          />
        </div>
        <CardDescription className="mt-2 text-sm text-muted-foreground">
          {animal_afinidade.animal.descricao || 'Sem descrição disponível.'}
        </CardDescription>
      </CardContent>

      <CardFooter className="mt-auto pt-4 flex justify-between items-center">
        <Badge className='text-md'>
          <strong>Afinidade:</strong>{animal_afinidade.afinidade_percent}%
        </Badge>
        <Button variant="ghost" size="icon" title="Detalhes">
          <Info />
        </Button>
        <Button variant="link" size="icon-lg" title="Rejeitar"
          onClick={() => mudarStatus(
              'rejeitado',
              animal_afinidade.animal.id,
              onStatusChangeSuccess
            )}
        >
          <X className="size-6" />
        </Button>
        <Button variant="outline" size="icon-lg" title="Escolher"
          onClick={() => mudarStatus(
              'escolhido',
              animal_afinidade.animal.id,
              onStatusChangeSuccess
            )}
        >
          <Heart fill='white' className="size-6" />
        </Button>
      </CardFooter>
    </Card>
  );
}