'use client';

import { useState, useEffect } from 'react';
import type { Animal } from '@/types'; // Importa nossos tipos
import AnimalCard from './CardAnimalAffinity'; // Importa o card com shadcn

const getTokenFromStorage = () => {
    if (typeof window === "undefined") return null
    const keysToTry = ["token", "access_token", "authToken", "jwt"]
    let raw: string | null = null
    for (const k of keysToTry) {
      raw = localStorage.getItem(k)
      if (raw) break
    }
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed?.access_token || parsed?.token || parsed?.jwt || raw
    } catch {
      return raw
    }
  }

interface Props {
  userId: string;
}

// Função para buscar dados da nossa API interna
async function fetchAnimais(userId: string, page: number): Promise<Animal[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/animais/${userId}/recomendar?page=${page}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getTokenFromStorage()}`,
      },
    });

    console.log('Fetch Animais Response:', response);

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error(error);
    return []; // Retorna array vazio em caso de erro
  }
}

export default function AffinityCarousel({ userId }: Props) {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Índice do animal
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true); // Se há mais páginas

  // 1. Busca inicial de dados
  useEffect(() => {
    setIsLoading(true);
    fetchAnimais(userId, 1).then((initialAnimais) => {
      setAnimais(initialAnimais);
      setIsLoading(false);
      if (initialAnimais.length < 10) { // Assumindo 10 por página
        setHasMore(false);
      }
    });
  }, [userId]); 

  // 2. Função para buscar mais animais (Paginação)
  const loadMore = async () => {
    if (isLoading || !hasMore) return; 

    setIsLoading(true);
    const nextPage = page + 1;
    const newAnimais = await fetchAnimais(userId, nextPage);

    if (newAnimais.length > 0) {
      setAnimais((prev) => [...prev, ...newAnimais]); 
      setPage(nextPage);
    }
    
    if (newAnimais.length < 10) {
      setHasMore(false); // Chegamos ao fim
    }
    
    setIsLoading(false);
  };

  // 3. Lógica de navegação
  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < animais.length) {
      setCurrentIndex(nextIndex);
    }

    // 4. Lógica de Paginação:
    // Quando estiver a 3 itens do fim, busca mais
    if (nextIndex >= animais.length - 3 && hasMore && !isLoading) {
      loadMore();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // ----- RENDERIZAÇÃO -----

  if (isLoading && animais.length === 0) {
    return <div style={{color: 'white'}}>Carregando afinidades...</div>;
  }

  if (animais.length === 0) {
    return <div style={{color: 'white'}}>Nenhum animal encontrado.</div>;
  }

  // Pega os 3 animais para a UI (anterior, atual, próximo)
  const prevAnimal = animais[currentIndex - 1]; 
  const currentAnimal = animais[currentIndex];
  const nextAnimal = animais[currentIndex + 1]; 

  return (
    <div className="affinity-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      
      <button onClick={handlePrev} disabled={currentIndex === 0} style={{color: 'white', background: 'none', border: 'none', fontSize: '2rem'}}>&lt;</button>

      <div className="carousel-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* 1. ANIMAL ANTERIOR (Preview) */}
        {prevAnimal && (
          <div style={{ opacity: 0.5, transform: 'scale(0.8)' }}>
            <AnimalCard animal={prevAnimal} />
          </div>
        )}

        {/* 2. ANIMAL ATUAL (Foco) */}
        {currentAnimal && (
          <div className="story-main">
            <AnimalCard animal={currentAnimal} />
          </div>
        )}

        {/* 3. PRÓXIMO ANIMAL (Preview) */}
        {nextAnimal && (
          <div style={{ opacity: 0.5, transform: 'scale(0.8)' }}>
            <AnimalCard animal={nextAnimal} />
          </div>
        )}
      </div>
      
      <button onClick={handleNext} disabled={currentIndex === animais.length - 1 && !hasMore} style={{color: 'white', background: 'none', border: 'none', fontSize: '2rem'}}>
        &gt;
      </button>

      {/* Indicador de loading de paginação */}
      {isLoading && animais.length > 0 && <div style={{color: 'white'}}>Carregando mais...</div>}
    </div>
  );
}