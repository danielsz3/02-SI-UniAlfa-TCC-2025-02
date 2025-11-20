'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Animal, AnimalAffinity } from '@/types';
import AnimalCard from './CardAnimalAffinity';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Loader2 } from 'lucide-react';
import { getToken } from '@/lib/api';

interface FetchResponse {
  data: AnimalAffinity[];
  total: number;
}

async function fetchAnimais(
  userId: string,
  rangeStart: number,
  limit: number
): Promise<FetchResponse> {
  try {
    const rangeEnd = rangeStart + limit - 1;
    const rangeParam = JSON.stringify([rangeStart, rangeEnd]);
    const sortParam = JSON.stringify(['created_at', 'DESC']);

    const params = new URLSearchParams({
      range: rangeParam,
      sort: sortParam,
      filter: '{}',
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL
      }/usuarios/${userId}/recomendar-animais?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    const contentRangeHeader = response.headers.get('Content-Range');
    let total = 0;

    if (contentRangeHeader) {
      const totalMatch = contentRangeHeader.split('/')[1];
      if (totalMatch) {
        total = parseInt(totalMatch, 10);
      }
    }
    const data = await response.json();
    const items = Array.isArray(data) ? data : [];
    return { data: items, total };
  } catch (error) {
    console.error(error);
    return { data: [], total: 0 };
  }
}

// --- Props do Componente ---
interface Props {
  userId: string;
  onAnimalClick: (animal: Animal) => void;
}

export default function AffinityCarousel({ userId, onAnimalClick }: Props) {

  const [api, setApi] = useState<CarouselApi>();
  const [animais, setAnimais] = useState<AnimalAffinity[]>([]);
  const [limit] = useState(10);
  const [nextRangeStart, setNextRangeStart] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {


    if (!userId) {
      setIsLoading(false);
      setAnimais([]);
      return;
    }

    setIsLoading(true);
    setAnimais([]);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 2000));
    const dataFetch = fetchAnimais(userId, 0, limit);

    Promise.all([dataFetch, minDelay]).then(([response]) => {
      const { data, total } = response;

      setAnimais(data);
      const newNextRangeStart = 0 + data.length;
      setNextRangeStart(newNextRangeStart);
      setHasMore(newNextRangeStart < total);

      setIsLoading(false);
    });
  }, [userId, limit]);

  const loadMore = useCallback(async () => {
    if (isPaginating || !hasMore) return;

    setIsPaginating(true);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 2000));

    const dataFetch = fetchAnimais(userId, nextRangeStart, limit);

    const [response] = await Promise.all([dataFetch, minDelay]);

    const { data: newAnimais, total } = response;

    if (newAnimais.length > 0) {
      setAnimais((prev) => {
        const existingIds = new Set(prev.map((a) => a.animal.id));
        const uniqueNewAnimais = newAnimais.filter(
          (novoAnimal) => !existingIds.has(novoAnimal.animal.id)
        );
        return [...prev, ...uniqueNewAnimais];
      });
      const newNextRangeStart = nextRangeStart + newAnimais.length;
      setNextRangeStart(newNextRangeStart);
      setHasMore(newNextRangeStart < total);
    } else {
      setHasMore(false);
    }

    setIsPaginating(false);
  }, [isPaginating, hasMore, userId, limit, nextRangeStart]);


  useEffect(() => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
    const handleSelect = () => {
      const newIndex = api.selectedScrollSnap();
      const totalSnaps = api.scrollSnapList().length;
      setSelectedIndex(newIndex);
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

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center h-[350px] text-primary">
        <Loader2 className="size-20 animate-spin" />
      </div>
    );
  }

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
          watchDrag: !isProcessing,
        }}
        className={`w-full transition-opacity duration-300 ${isProcessing ? 'pointer-events-none opacity-80' : ''
          }`}
      >
        <CarouselContent className="flex gap-4">
          {animais.map((animal, index) => (
            <CarouselItem
              key={animal.animal.id}
              className="min-w-0 pl-0 basis-full md:basis-1/2 xl:basis-1/3"
            >
              <div
                aria-hidden={index !== selectedIndex}
                className={`
                    p-1 md:w-[50vw] w-full pl-0 sm:pl-5 lg:w-full h-full
                    transition-all duration-500 ease-in-out
                    ${index === 0 ? 'pl-5' : 'xs:pl-10 md:pl-0'}
                    ${index === selectedIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-60 scale-80 pointer-events-none'
                  }
                    `}
              >
                <AnimalCard
                  onAnimalClick={() => onAnimalClick(animal.animal)}
                  animal_afinidade={animal}
                  onStatusChangeSuccess={handleRemoverAnimalDaLista}
                  isParentProcessing={isProcessing}
                  onActionStart={() => setIsProcessing(true)}
                  onActionEnd={() => setIsProcessing(false)}
                />
              </div>
            </CarouselItem>
          ))}

          {isPaginating && (
            <CarouselItem className="basis-full md:basis-1/2 lg:basis-1/3 opacity-60 scale-90">
              <div className="flex h-full min-h-[350px] w-full items-center justify-center rounded-lg border-3 border-dashed">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            </CarouselItem>
          )}
        </CarouselContent>

        {!isProcessing && (
          <>
            <CarouselPrevious className="hidden lg:flex" />
            <CarouselNext className="hidden lg:flex" />
          </>
        )}
      </Carousel>
    </div>
  );
}
