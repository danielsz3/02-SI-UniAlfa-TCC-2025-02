// app/adotar/afinidade/page.tsx
'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AffinityCarousel from '@/components/AffinityCarousel'; 
import { X } from 'lucide-react'; // Ícone para o botão de fechar

type User = {
  id: number | string;
};

export default function AffinityPage() {
  const router = useRouter(); 
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    router.push('/adotar'); 
  };

  // Trava/Destrava o scroll (lógica não muda)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Lógica do localStorage (não muda)
    const userJsonString = localStorage.getItem('user');
    if (userJsonString) {
      try {
        const userObject: User = JSON.parse(userJsonString);
        if (userObject && userObject.id) {
          setUserId(String(userObject.id));
        } else {
          setError('Erro: ID de usuário inválido.');
        }
      } catch (e) {
        setError('Erro: Dados de usuário corrompidos.');
      }
    } else {
      setError('Erro: Usuário não autenticado.');
    }

    // Função de limpeza
    return () => {
      document.body.style.overflow = '';
    };
  }, []); 

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/95" 
      onClick={handleClose}
    >
      <button
        onClick={handleClose} 
        className="absolute top-5 right-5 z-10 text-white"
      >
        <X size={32} />
      </button>

      {/* Use case: Parar propagação de clique */}
      <div onClick={(e) => e.stopPropagation()}>
        {error ? (
          <div className="text-white">{error}</div>
        ) : userId ? (
          <AffinityCarousel userId={userId} />
        ) : (
          // Use case: Estado de loading
          <div className="text-white">Carregando...</div>
        )}
      </div>
    </div>
  );
}