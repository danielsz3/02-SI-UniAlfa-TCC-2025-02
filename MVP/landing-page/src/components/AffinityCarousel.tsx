'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Animal, AnimalAffinity } from '@/types'; // Importa nossos tipos
import AnimalCard from './CardAnimalAffinity'; // Importa o card com shadcn

// --- Importações Adicionadas ---
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi, // Tipo da API do carrossel
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton'; // Para loading inicial
import { Loader2 } from 'lucide-react'; // Ícone de carregamento

// --- Funções de API ( getTokenFromStorage ) ---
const getTokenFromStorage = () => {
  if (typeof window === 'undefined') return null;
  const keysToTry = ['token', 'access_token', 'authToken', 'jwt'];
  let raw: string | null = null;
  for (const k of keysToTry) {
    raw = localStorage.getItem(k);
    if (raw) break;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.access_token || parsed?.token || parsed?.jwt || raw;
  } catch {
    return raw;
  }
};

// --- Funções de API ( fetchAnimais ) ---
async function fetchAnimais(
  userId: string,
  page: number
): Promise<AnimalAffinity[]> {
  try {
    // Adicionei query params de paginação
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userId}/recomendar-animais?page=${page}&limit=10`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getTokenFromStorage()}`,
        },
      }
    );

    const data = await response.json();
    // Assumindo que a API retorna um array direto.
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(error);
    return []; // Retorna array vazio em caso de erro
  }
}

// --- Props do Componente ---
interface Props {
  userId: string;
}

// --- Componente Refatorado ---
export default function AffinityCarousel({ userId }: Props) {
  // 1. Estados
  const [api, setApi] = useState<CarouselApi>(); // API do Carrossel
  const [animais, setAnimais] = useState<AnimalAffinity[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); // Apenas para carga inicial
  const [isPaginating, setIsPaginating] = useState(false); // Para paginações
  const [hasMore, setHasMore] = useState(true);

  // Estado para guardar o índice do item em foco
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 2. Busca inicial de dados
  useEffect(() => {
    setIsLoading(true);
    fetchAnimais(userId, 1).then((initialAnimais) => {
      setAnimais(initialAnimais);
      setIsLoading(false);
      if (initialAnimais.length < 10) {
        setHasMore(false);
      }
    });
  }, [userId]);

  // 3. Função para buscar mais animais (Paginação)
  const loadMore = useCallback(async () => {
    if (isPaginating || !hasMore) return;

    setIsPaginating(true);

    const nextPage = page + 1;
    const newAnimais = await fetchAnimais(userId, nextPage);

    if (newAnimais.length > 0) {
      // --- CORREÇÃO DE DUPLICADOS ---
      setAnimais((prev) => {
        // 1. Cria um Set (conjunto) com todos os IDs de animais que já temos
        const existingIds = new Set(prev.map((a) => a.animal.id));

        // 2. Filtra a lista de 'newAnimais'
        const uniqueNewAnimais = newAnimais.filter(
          (novoAnimal) => !existingIds.has(novoAnimal.animal.id)
        );

        // 3. Retorna a lista anterior + apenas os animais que são novos
        return [...prev, ...uniqueNewAnimais];
      });
      // --- FIM DA CORREÇÃO ---

      setPage(nextPage); // Atualiza a página
    }

    // Se a API retornou menos de 10 (ou zero, ou duplicados que foram filtrados)
    // consideramos que não há mais o que buscar.
    if (newAnimais.length < 10) {
      setHasMore(false); // Chegamos ao fim
    }

    setIsPaginating(false);
  }, [isPaginating, hasMore, page, userId]); // Dependências do useCallback

  // 4. Lógica de Paginação E Estilos de Foco (useEffect)
  useEffect(() => {
    if (!api) {
      return;
    }

    // Define o índice inicial assim que a API estiver pronta
    setSelectedIndex(api.selectedScrollSnap());

    // Função que "ouve" a mudança de slide
    const handleSelect = () => {
      const newIndex = api.selectedScrollSnap();
      const totalSnaps = api.scrollSnapList().length;

      // 1. Atualiza o estado de foco
      setSelectedIndex(newIndex);

      // 2. Lógica de Paginação (que já tínhamos)
      // Verifica se deve carregar mais
      if (newIndex >= totalSnaps - 3 && hasMore && !isPaginating) {
        loadMore();
      }
    };

    api.on('select', handleSelect); 

    return () => {
      api.off('select', handleSelect);
    };
  }, [api, hasMore, isPaginating, loadMore]); 

  const handleRemoverAnimalDaLista = (animalId: number) => {
    setAnimais((listaAtual) =>
      listaAtual.filter((item) => item.animal.id !== animalId)
    );
  };
  // ----- RENDERIZAÇÃO -----

  // 1. Estado de Carregamento Inicial (Usa Skeleton)
  if (isLoading) {
    return (
      <div className="flex w-full max-w-6xl mx-auto space-x-4 p-4">
        <Skeleton className="h-[350px] w-full rounded-lg md:w-1/2 lg:w-1/3" />
        <Skeleton className="h-[350px] w-1/2 rounded-lg hidden md:block lg:w-1/3" />
        <Skeleton className="h-[350px] w-1/3 rounded-lg hidden lg:block" />
      </div>
    );
  }

  // 2. Estado Vazio (Usa Tailwind)
  if (animais.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Nenhum animal com afinidade encontrado.
      </div>
    );
  }

  return (
    <div className="w-[90vw] mx-auto">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'center',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent
          className="flex gap-4"
        >
          {/* Mapeia todos os animais */}
          {animais.map((animal, index) => (
            <CarouselItem
              key={animal.animal.id}
              className="w-full pl-4 basis-full sm:basis-1/2"
            >
              <div
                aria-hidden={index !== selectedIndex}
                className={`
                    p-1 w-fullh-full
                    transition-all duration-500 ease-in-out
                    ${
                      index === selectedIndex
                        ? 'opacity-100 scale-100' // Em foco
                        : 'opacity-60 scale-80 pointer-events-none' // Fora de foco
                    }
                  `}
              >
                <AnimalCard
                  animal_afinidade={animal}
                  onStatusChangeSuccess={handleRemoverAnimalDaLista}
                />
              </div>
            </CarouselItem>
          ))}

          {/* Item de Loading da Paginação */}
          {isPaginating && (
            // <-- MUDANÇA 4: Removemos 'pl-4' aqui também
            <CarouselItem className="basis-full md:basis-1/2 lg:basis-1/3 opacity-60 scale-90">
              <div className="flex h-full min-h-[350px] w-full items-center justify-center rounded-lg border-3 border-dashed">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            </CarouselItem>
          )}
        </CarouselContent>

        {/* Botões de Navegação (escondidos em mobile) */}
        <CarouselPrevious className="hidden lg:flex" />
        <CarouselNext className="hidden lg:flex" />
      </Carousel>
    </div>
  );
}