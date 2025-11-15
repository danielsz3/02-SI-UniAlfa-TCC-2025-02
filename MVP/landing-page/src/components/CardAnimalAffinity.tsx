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
import { Heart, Info, X, Loader2 } from 'lucide-react'; // <-- ALTERAÇÃO: Importa o Loader2
import { toast } from 'sonner';
import { useState } from 'react'; // <-- ALTERAÇÃO: Importa o useState
import { getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Props {
  animal_afinidade: AnimalAffinity;
  onStatusChangeSuccess: (animalId: number) => void;
  onAnimalClick: (animal: AnimalAffinity) => void;
}

// A função 'mudarStatus' que estava aqui foi movida
// para dentro do componente para podermos usar o state.

export default function CardAnimalAffinity({
  animal_afinidade,
  onStatusChangeSuccess,
  onAnimalClick,
}: Props) {

  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<
    'escolhido' | 'rejeitado' | null
  >(null);

  const handleMudarStatus = async (status: 'escolhido' | 'rejeitado') => {
    if (loadingAction) return;

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
      });;

      // Chama a função do componente pai para remover o card da lista
      onStatusChangeSuccess(animal_afinidade.animal.id);

      // Nota: Não precisamos de 'setLoadingAction(null)' aqui,
      // porque o componente será removido da lista pelo pai.

    } catch (error) {
      // 5. Erro!
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro: ${errorMessage}`, { id: toastId });

      // Se der erro, reativamos os botões
      setLoadingAction(null);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{animal_afinidade.animal.nome}</CardTitle>
        <p>{calcularIdade(animal_afinidade.animal.data_nascimento)}</p>
        <Badge className="capitalize absolute top-7 right-7">
          {animal_afinidade.animal.sexo}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative">
        <div className="w-full h-[45vh] md:h-[35vh] overflow-hidden rounded-t-lg">
          <ImageCarousel images={animal_afinidade.animal.imagens} />
        </div>
        <CardDescription className="mt-2 text-sm text-muted-foreground">
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
            size="icon"
            title="Detalhes"
            className="rounded-full cursor-pointer"
            onClick={() => onAnimalClick(animal_afinidade)}
            disabled={!!loadingAction}
          >
            <Info className="size-5" />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            title="Rejeitar"
            className="cursor-pointer"
            onClick={() => handleMudarStatus('rejeitado')}
            disabled={!!loadingAction}
          >
            {loadingAction === 'rejeitado' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <X className="size-5" />
            )}
          </Button>

          <Button
            variant="default"
            size="icon"
            title="Escolher"
            className="cursor-pointer"
            onClick={() => handleMudarStatus('escolhido')}
            disabled={!!loadingAction}
          >
            {loadingAction === 'escolhido' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Heart fill="white" className="size-5" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}