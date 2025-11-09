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

interface Props {
  animal_afinidade: AnimalAffinity;
}

export default function CardAnimalAffinity({ animal_afinidade }: Props) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{animal_afinidade.animal.nome}</CardTitle>
        <p>{calcularIdade(animal_afinidade.animal.data_nascimento)}</p>
        <Badge className='capitalize absolute top-7 right-7'>{animal_afinidade.animal.sexo}</Badge>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative"> {/* p-0 e relative */}
        <ImageCarousel
          images={animal_afinidade.animal.imagens}
        />
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
        <Button variant="link" size="icon-lg" title="Rejeitar">
          <X className="size-6" />
        </Button>
        <Button variant="outline" size="icon-lg" title="Escolher">
          <Heart fill='white' className="size-6" />
        </Button>
      </CardFooter>
    </Card>
  );
}