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
import { Heart, Info, X, Loader2, Icon, PawPrint, Clock, BatteryChargingIcon, TreePalmIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface Props {
  animal_afinidade: AnimalAffinity;
  onStatusChangeSuccess: (animalId: number) => void;
  onAnimalClick: (animal: AnimalAffinity) => void;
  isParentProcessing: boolean;
  onActionStart: () => void;
  onActionEnd: () => void;
}

const nivelEnergia = [
  { id: 'baixa', name: 'Calmo' },
  { id: 'moderada', name: 'Ativo' },
  { id: 'alta', name: 'Muito Ativo' },
]

const tamanho = [
  { id: 'pequeno', name: 'Pequeno' },
  { id: 'medio', name: 'Médio' },
  { id: 'grande', name: 'Grande' },
]

const tempoNecessario = [
  { id: 'pouco_tempo', name: 'Baixo' },
  { id: 'tempo_moderado', name: 'Moderado' },
  { id: 'muito_tempo', name: 'Alto' },
]

const ambienteIdeal = [
  { id: 'area_pequena', name: 'Área Pequena' },
  { id: 'area_media', name: 'Área Média' },
  { id: 'area_externa', name: 'Área Externa' },
]

export function AfinidadeTooltip({ animal_afinidade }: { animal_afinidade: AnimalAffinity }) {

  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <Tooltip
      open={isTooltipOpen}
      onOpenChange={setIsTooltipOpen}
    >
      <TooltipTrigger asChild>
        <Button
          variant="link"
          title="Afinidade"
          className='p-0'
          onClick={() => setIsTooltipOpen((prev) => !prev)}
        >
          <Badge className="text-lg md:text-lg px-3 py-1 whitespace-nowrap shrink-0">
            <strong className="hidden lg:inline-block mr-1">Afinidade:</strong>
            <strong>{animal_afinidade.afinidade_percent}%</strong>
          </Badge>
        </Button>
      </TooltipTrigger>

      <TooltipContent>
        <p>Percentual de afinidade</p>
      </TooltipContent>
    </Tooltip>
  );
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

  const animalAtributos = [
    {
      label: "Tamanho",
      icon: PawPrint,
      // A lógica de busca fica aqui, limpando o JSX
      value: tamanho.find((t) => t.id === animal_afinidade.animal.tamanho)?.name || animal_afinidade.animal.tamanho
    },
    {
      label: "Energia",
      icon: BatteryChargingIcon,
      value: nivelEnergia.find((n) => n.id === animal_afinidade.animal.nivel_energia)?.name || animal_afinidade.animal.nivel_energia
    },
    {
      label: "Tempo Necessário",
      icon: Clock,
      value: tempoNecessario.find((t) => t.id === animal_afinidade.animal.tempo_necessario)?.name || animal_afinidade.animal.tempo_necessario
    },
    {
      label: "Ambiente",
      icon: TreePalmIcon,
      value: ambienteIdeal.find((a) => a.id === animal_afinidade.animal.ambiente_ideal)?.name || animal_afinidade.animal.ambiente_ideal
    }
  ];

  const isGlobalDisabled = isParentProcessing || !!loadingAction;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>{animal_afinidade.animal.nome}</CardTitle>
        <p>{calcularIdade(animal_afinidade.animal.data_nascimento)}</p>
        <Badge className="capitalize absolute h-10 w-20 text-md top-7 right-7">
          {animal_afinidade.animal.sexo}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-0 pb-6 xs:pb-3 block">
        <div className="w-full h-[40vh]  md:h-[35vh] overflow-hidden rounded-t-lg">
          <ImageCarousel images={animal_afinidade.animal.imagens} />
        </div>
        <div className="text-md text-muted-foreground ">
          <div className="grid grid-cols-2 gap-3 mt-6 w-full">
            {animalAtributos.map((detail, index) => (
              <div key={index} className="w-full h-full">

                <div className="bg-background border-2 text-primary dark:text-white p-2 w-full h-full min-h-[70px] rounded-xl 
                      flex flex-row items-center justify-start shadow-sm 
                      hover:shadow-md transition-transform duration-300 hover:scale-[1.02]">

                  {/* BLOCO 1: Ícone */}
                  <div className="shrink-0 p-2 mr-1 rounded-full">
                    <detail.icon className="size-5 md:size-6" />
                  </div>

                  {/* BLOCO 2: Textos (Título e Valor empilhados) */}
                  <div className="flex flex-col items-start text-left overflow-hidden">

                    {/* Label (Título Pequeno) */}
                    <span className="text-[11px] md:text-xs uppercase tracking-wide font-bold opacity-80">
                      {detail.label}
                    </span>

                    {/* Valor (Informação Principal) */}
                    <span className="text-sm md:text-sm lg:text-sm font-bold leading-tight truncate w-full" title={detail.value}>
                      {detail.value || "-"}
                    </span>

                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto pt-0 flex justify-between items-center">

        <AfinidadeTooltip
          animal_afinidade={animal_afinidade}
        />
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