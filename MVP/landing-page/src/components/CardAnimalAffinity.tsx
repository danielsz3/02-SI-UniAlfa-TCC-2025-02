'use client';

import type { AnimalAffinity } from '@/types';
import { Badge } from './ui/badge';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ImageCarousel from './ImageCarousel';
import { calcularIdade } from '@/lib/animal-utils';
import { Button } from './ui/button';
import { Heart, Info, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Props {
  animal_afinidade: AnimalAffinity;
  onStatusChangeSuccess: (animalId: number) => void;
  onAnimalClick: (animal: AnimalAffinity) => void;
  isParentProcessing: boolean;
  onActionStart: () => void;
  onActionEnd: () => void;
}

export default function CardAnimalAffinity({
  animal_afinidade,
  onStatusChangeSuccess,
  onAnimalClick,
  isParentProcessing,
  onActionStart,
  onActionEnd,
}: Props) {

  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<
    'escolhido' | 'rejeitado' | null
  >(null);

  const handleMudarStatus = async (status: 'escolhido' | 'rejeitado') => {
    if (loadingAction) return;

    onActionStart();

    setLoadingAction(status);

    // 3. Mostra o toast de loading
    const toastId = toast.loading(
      status === 'escolhido'
        ? 'A escolher o animal...'
        : 'A rejeitar o animal...'
    );

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/match-afinidades/mudar-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            status,
            animal_id: animal_afinidade.animal.id,
            usuario_id: JSON.parse(localStorage.getItem('user') || '{}').id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao mudar status');
      }

      // 4. Sucesso!
      toast.success(`Animal ${status} com sucesso!`, {
        id: toastId,
        action: {
          label: 'Ver lista',
          onClick: () => {
            router.push(`/painel-adotante?status=${status}`);
          },
        },
        actionButtonStyle: {
          backgroundColor: '#0367A6',
          color: 'white',
          fontSize: '0.8rem',
        },
        duration: 3000,
      });;

      // Chama a função do componente pai para remover o card da lista
      onStatusChangeSuccess(animal_afinidade.animal.id);

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro: ${errorMessage}`, { id: toastId, richColors: true });

      setLoadingAction(null);
    } finally {
      onActionEnd();
    }
  };

  const isGlobalDisabled = isParentProcessing || !!loadingAction;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{animal_afinidade.animal.nome}</CardTitle>
        <p>{calcularIdade(animal_afinidade.animal.data_nascimento)}</p>
        <Badge className="capitalize absolute h-10 w-20 text-md top-7 right-7">
          {animal_afinidade.animal.sexo}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative">
        <div className="w-full h-[45vh] md:h-[35vh] overflow-hidden rounded-t-lg">
          <ImageCarousel images={animal_afinidade.animal.imagens} />
        </div>
        <CardDescription className="mt-2 text-md text-muted-foreground">
          {animal_afinidade.animal.descricao || 'Sem descrição disponível.'}
        </CardDescription>
      </CardContent>

      <CardFooter className="mt-auto pt-4 flex justify-between items-center">
        <Badge className="text-md">
          <strong>Afinidade:</strong>
          {animal_afinidade.afinidade_percent}%
        </Badge>
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon-lg"
            title="Detalhes"
            className="rounded-full cursor-pointer size-10 hover:scale-110"
            onClick={() => onAnimalClick(animal_afinidade)}
            disabled={isGlobalDisabled}
          >
            <Info className="size-6" />
          </Button>

          <Button
            variant="destructive"
            size="icon-lg"
            title="Rejeitar"
            className="cursor-pointer size-10 hover:scale-110"
            onClick={() => handleMudarStatus('rejeitado')}
            disabled={isGlobalDisabled}
          >
            {loadingAction === 'rejeitado' ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <X className="size-6" />
            )}
          </Button>

          <Button
            variant="default"
            size="icon-lg"
            title="Escolher"
            className="cursor-pointer size-15 rounded-full hover:scale-110 duration-300 ease-in-out"
            onClick={() => handleMudarStatus('escolhido')}
            disabled={isGlobalDisabled}
          >
            {loadingAction === 'escolhido' ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Heart className="size-8 fill-current " />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}