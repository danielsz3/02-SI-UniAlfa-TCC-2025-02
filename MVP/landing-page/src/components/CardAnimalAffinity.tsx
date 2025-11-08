'use client';

import Image from 'next/image';
import type { Animal } from '@/types'; // Importe seus tipos

// Componentes do Shadcn/ui
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'; // Verifique o caminho

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Verifique o caminho

interface Props {
  animal: Animal;
}

export default function CardAnimalAffinity({ animal }: Props) {
  return (
    <Card className="w-[300px] h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>{animal.nome}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative"> {/* p-0 e relative */}
        
        <Carousel className="w-full h-full">
          <CarouselContent className="h-full">
            
            {animal.imagens && animal.imagens.map((imagem) => (
              <CarouselItem key={imagem.id} className="h-full">
                
                <div className="relative w-full h-full">
                  <Image
                    src={imagem.caminho}
                    alt={`Imagem de ${animal.nome}`}
                    fill // 'fill' faz a imagem preencher o contêiner pai
                    style={{ objectFit: 'cover' }} // Garante que a imagem cubra a área
                  />
                </div>
                
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <CarouselPrevious className="absolute left-2" />
          <CarouselNext className="absolute right-2" />
          
        </Carousel>
      </CardContent>

      <CardFooter className="mt-auto pt-4">
        <p>Ações (like, etc.)</p>
      </CardFooter>
    </Card>
  );
}