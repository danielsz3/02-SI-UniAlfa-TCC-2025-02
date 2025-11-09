'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AffinityCarousel from '@/components/AffinityCarousel';
import { X } from 'lucide-react'; // Ícone para o botão de fechar
import Link from 'next/link';
import Image from 'next/image';

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
    const userJsonString = localStorage.getItem('user')
    if (userJsonString) {
      try {
        const userObject: User = JSON.parse(userJsonString);
        if (userObject && userObject.id) {
          setUserId(String(userObject.id))
        } else {
          setError('Erro: ID de usuário inválido.')
        }
      } catch (e) {
        setError('Erro: Dados de usuário corrompidos.')
      }
    } else {
      setError('Erro: Usuário não autenticado.')
    }

    // Função de limpeza
    return () => {
      document.body.style.overflow = ''
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/95"
    >
      <div className='absolute top-5 left-5 z-10'>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="PetAffinity" width={32} height={32} />
          <span className="text-xl font-bold tracking-tight text-white">PetAffinity</span>
        </Link>
      </div>
      <button
        onClick={handleClose}
        className="absolute top-4 right-2 z-10 text-white hover:bg-primary rounded-full p-2 transition"
      >
        <X size={24} />
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