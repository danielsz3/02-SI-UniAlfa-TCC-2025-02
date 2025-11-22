'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calcularIdade } from '@/lib/animal-utils';
import { AnimalDetailModal } from '@/components/animal/AnimalDetailModal';

import { Animal } from '@/types';
import { getToken } from '@/lib/api';
import { ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import LoadMoreList from '@/components/LoadMoreList';

// ---------------------- CONFIG ----------------------

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const USER_KEY = 'user';

const chipTipos: Record<string, { label: string; bgCor: string; textCor: string }> = {
  disponivel: { label: 'Disponível', bgCor: '#1976d2', textCor: '#fff' },
  adotado: { label: 'Adotado', bgCor: '#9c27b0', textCor: '#fff' },
  em_adocao: { label: 'Em Adoção', bgCor: '#425a8fff', textCor: '#fff' },
  em_aprovacao: { label: 'Em Aprovação', bgCor: '#296b2c', textCor: '#fff' },
};

type MatchStatus = 'em_adocao' | 'escolhido' | 'rejeitado' | 'finalizado' | 'anunciados';

type MatchItem = {
  id: number;
  status: MatchStatus;
  animal: Animal & { situacao?: string };
  observacao: string;
  created_at?: string | null;
  usuario_id: number;
  animal_id: number;
};

type User = { id: number; [key: string]: any };

type StatusFilter = MatchStatus;

const VALID_STATUSES: StatusFilter[] = [
  'em_adocao',
  'escolhido',
  'rejeitado',
  'finalizado',
  'anunciados',
];

// ---------------------- API SERVICE ----------------------

const apiService = {
  getToken: () => getToken(),

  getStoredUserId: (): number | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (!storedUser) return null;
      const user: User = JSON.parse(storedUser);
      return user?.id || null;
    } catch {
      return null;
    }
  },

  getAuthHeaders: () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = apiService.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  fetch: async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: apiService.getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Falha na requisição');
    }

    return res.json().catch(() => null);
  },

  fetchMatches: async (userId: number): Promise<MatchItem[]> => {
    const filter = encodeURIComponent(JSON.stringify({ usuario_id: userId }));
    const order = encodeURIComponent(JSON.stringify(['created_at', 'DESC']));
    const json = await apiService.fetch(`/match-afinidades?filter=${filter}&order=${order}`);

    return Array.isArray(json) ? json : json.data ?? json.items ?? json ?? [];
  },

  fetchMyAnimals: async (userId: number): Promise<Animal[]> => {
    const filter = encodeURIComponent(JSON.stringify({ usuario_id: userId }));
    const order = encodeURIComponent(JSON.stringify(['updated_at', 'DESC']));
    const json = await apiService.fetch(`/animais?filter=${filter}&order=${order}`);

    return Array.isArray(json) ? json : json.data ?? json.items ?? json ?? [];
  },
};

// ---------------------- HOOK ----------------------

function useAdotanteData() {
  const [userId, setUserId] = useState<number | null>(null);
  const [allItems, setAllItems] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = apiService.getStoredUserId();
    if (!id) {
      setError('Usuário não autenticado.');
      setLoading(false);
      return;
    }
    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    Promise.all([apiService.fetchMatches(userId), apiService.fetchMyAnimals(userId)])
      .then(([matches, animals]) => {
        const formattedAnimals: MatchItem[] = animals.map(a => ({
          id: a.id,
          status: 'anunciados',
          animal: a,
          observacao: '',
          created_at: a.created_at,
          usuario_id: userId,
          animal_id: a.id,
        }));

        setAllItems([...matches, ...formattedAnimals]);
      })
      .catch(err => {
        setError(err.message);
        setAllItems([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const counts = useMemo(
    () => ({
      em_adocao: allItems.filter(m => m.status === 'em_adocao').length,
      escolhido: allItems.filter(m => m.status === 'escolhido').length,
      rejeitado: allItems.filter(m => m.status === 'rejeitado').length,
      finalizado: allItems.filter(m => m.status === 'finalizado').length,
      anunciados: allItems.filter(m => m.status === 'anunciados').length,
    }),
    [allItems]
  );

  return { allItems, counts, isLoading: loading, error };
}

// ---------------------- PAGE HEADER ----------------------

const PageHeader = () => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-2xl font-semibold">Painel do Adotante</h3>
      <p className="text-sm text-muted-foreground font-medium">
        Gerencie seus pedidos, afinidades e anúncios
      </p>
    </div>

    <Button asChild>
      <a href="/adotar">Animais disponíveis</a>
    </Button>
  </div>
);

// ---------------------- CARD COMPONENT ----------------------

const MatchItemCard = ({ item, onSee }: { item: MatchItem; onSee: () => void }) => {
  const { animal, status, created_at, observacao } = item;
  const idade = calcularIdade(animal.data_nascimento ?? '');
  const img = animal.imagens?.[0]?.caminho;

  let badgeLabel = '';
  let badgeStyle: React.CSSProperties = {};
  let badgeClass = 'text-xs px-2 py-1 rounded-full font-semibold';

  if (status === 'anunciados') {
    const situacaoKey = animal.situacao || 'em_aprovacao';
    const config = chipTipos[situacaoKey] || chipTipos['em_aprovacao'];
    badgeLabel = config.label;
    badgeStyle = { backgroundColor: config.bgCor, color: config.textCor };
  } else {
    const map = {
      em_adocao: 'Em adoção',
      escolhido: 'Escolhido',
      rejeitado: 'Rejeitado',
      finalizado: 'Finalizado',
    };

    badgeLabel = map[status] ?? status;

    if (status === 'escolhido') badgeClass += ' bg-emerald-600 text-white';
    else if (status === 'rejeitado') badgeClass += ' bg-rose-700 text-white';
    else if (status === 'finalizado') badgeClass += ' bg-sky-600 text-white';
    else badgeClass += ' bg-yellow-600 text-white';
  }

  return (
    <Card className="flex items-center gap-4 p-3 hover:shadow-lg transition-shadow">
      <div className="w-20 h-20 rounded overflow-hidden bg-muted flex items-center justify-center">
        {img ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/imagens/${img}`}
            alt={animal.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-xs text-muted-foreground">Sem foto</div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <h4 className="font-semibold">{animal.nome}</h4>
            <p className="text-sm text-muted-foreground">{idade}</p>
            <p className="text-xs text-muted-foreground">
              {status === 'anunciados' ? 'Criado em ' : 'Pedido: '}
              {new Date(created_at ?? '').toLocaleDateString('pt-BR')}
            </p>
            {observacao && <p className="text-xs text-muted-foreground">{observacao}</p>}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={badgeClass} style={badgeStyle}>
              {badgeLabel}
            </span>

            <Button size="sm" variant="secondary" onClick={onSee}>
              <Eye className="w-4 h-4" />
            </Button>

            {status === 'escolhido' && (
              <Link href={`/adotar/form?animal_id=${animal.id}`}>
                <Button size="sm">
                  Adotar <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ---------------------- MAIN PAGE ----------------------

export default function PainelAdotantePage() {
  const { allItems, counts, isLoading, error } = useAdotanteData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlStatus = params.get('status') as StatusFilter;
  const statusFilter = VALID_STATUSES.includes(urlStatus) ? urlStatus : 'em_adocao';

  const handleFilterChange = (newStatus: StatusFilter) => {
    const p = new URLSearchParams(params);
    p.set('status', newStatus);
    router.replace(`${pathname}?${p.toString()}`);
  };

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  const filtered = allItems.filter(i => i.status === statusFilter);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader />

      {/* TABS */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {VALID_STATUSES.map(status => {
          const active = status === statusFilter;
          const map: Record<StatusFilter, string> = {
            em_adocao: 'Em adoção',
            escolhido: 'Escolhidos',
            rejeitado: 'Rejeitados',
            finalizado: 'Finalizados',
            anunciados: 'Meus anúncios',
          };

          return (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                active ? 'bg-sky-600 text-white' : 'bg-muted/40'
              }`}
            >
              {map[status]} <span>({counts[status]})</span>
            </button>
          );
        })}
      </div>

      {/* LISTA COM LOAD MORE */}
      <LoadMoreList
        url={`/api/local-items?status=${statusFilter}`} 
        step={6} 
        renderItem={(item) => (
          <MatchItemCard
            key={item.id}
            item={item}
            onSee={() => setSelectedAnimal(item.animal)}
          />
        )}
      />

      <AnimalDetailModal
        initialData={selectedAnimal}
        buttonAdotar={false}
        onClose={() => setSelectedAnimal(null)}
      />
    </div>
  );
}
