'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calcularIdade } from '@/lib/animal-utils';
import { AnimalDetailModal } from '@/components/animal/AnimalDetailModal';
import { Animal } from '@/types';
import { getToken } from '@/lib/api';
import { Eye } from 'lucide-react';

// --- Constantes e Tipos ---

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'token';
const USER_KEY = 'user'; // Assumindo que o usuário está salvo nesta chave

type MatchItem = {
  id: number;
  status: 'em_adocao' | 'escolhido' | 'rejeitado' | 'finalizado';
  animal: Animal;
  created_at?: string | null;
  usuario_id: number;
  animal_id: number;
};

type User = { id: number;[key: string]: any }; // Tipo simples para o usuário no storage

type StatusFilter = 'em_adocao' | 'escolhido' | 'rejeitado' | 'finalizado';

// --- Serviço de API Centralizado ---

const apiService = {
  
  getToken: () =>getToken(),

  /**
   * Pega o ID do usuário logado diretamente do localStorage.
   */
  getStoredUserId: (): number | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (!storedUser) return null;

      const user: User = JSON.parse(storedUser);
      return user?.id || null;
    } catch (e) {
      console.error('Falha ao parsear usuário do localStorage', e);
      return null;
    }
  },

  getAuthHeaders: () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = apiService.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  fetch: async (path: string, options: RequestInit = {}): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: apiService.getAuthHeaders(),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erro de rede');
      throw new Error(errorText || `Erro ${res.status} ao buscar ${path}`);
    }

    return res.json().catch(() => null);
  },

  /**
   * Busca TODOS os matches do usuário de uma vez.
   * A filtragem de status será feita no cliente.
   */
  fetchMatches: async (userId: number): Promise<MatchItem[]> => {
    // Filtra apenas por usuário, trazendo todos os status
    const filter = encodeURIComponent(JSON.stringify({ "usuario_id": userId }));
    const json = await apiService.fetch(`/match-afinidades?filter=${filter}`);

    return Array.isArray(json) ? json : (json.data ?? json.items ?? json ?? []);
  },
};

// --- Hook Customizado para a Lógica da Página ---

function useAdotanteData() {
  const [userId, setUserId] = useState<number | null>(null);
  const [allMatches, setAllMatches] = useState<MatchItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('em_adocao');
  const [loading, setLoading] = useState(true); // Loading geral
  const [error, setError] = useState<string | null>(null);

  // Efeito 1: Pega o ID do usuário (só na montagem)
  useEffect(() => {
    const id = apiService.getStoredUserId();
    if (id) {
      setUserId(id);
    } else {
      console.error('ID do usuário não encontrado no localStorage.');
      setError('Usuário não autenticado.');
      setLoading(false);
    }
  }, []);

  // Efeito 2: Busca TODOS os matches (quando o userId for encontrado)
  useEffect(() => {
    if (!userId) return; // Só roda se tivermos um ID

    setLoading(true);
    setError(null);

    apiService.fetchMatches(userId)
      .then(setAllMatches)
      .catch((e) => {
        console.error('Erro ao buscar matches', e);
        setError(e.message || 'Falha ao carregar dados.');
        setAllMatches([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]); // Depende apenas do userId

  // Memo: Calcula as contagens (agora funciona!)
  const counts = useMemo(() => ({
    em_adocao: allMatches.filter(m => m.status === 'em_adocao').length,
    escolhido: allMatches.filter(m => m.status === 'escolhido').length,
    rejeitado: allMatches.filter(m => m.status === 'rejeitado').length,
    finalizado: allMatches.filter(m => m.status === 'finalizado').length,
  }), [allMatches]);

  // Memo: Filtra a lista para exibição (baseado no statusFilter)
  const filteredMatches = useMemo(() =>
    allMatches.filter(m => m.status === statusFilter),
    [allMatches, statusFilter]
  );

  return {
    filteredMatches,
    counts,
    statusFilter,
    setStatusFilter,
    isLoading: loading,
    error,
  };
}

// --- Componentes de UI ---

const PageHeader = () => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-2xl font-semibold">Painel do Adotante</h3>
      <p className="text-sm text-muted-foreground">Gerencie seus pedidos e veja afinidades</p>
    </div>
    <Button asChild>
      <a href="/adotar">Animais disponíveis</a>
    </Button>
  </div>
);

interface FilterTabsProps {
  counts: Record<StatusFilter, number>;
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

const FilterTabs = ({ counts, activeFilter, onFilterChange }: FilterTabsProps) => (
  <div className="mb-6 flex items-center gap-3">
    {(['em_adocao', 'escolhido', 'rejeitado', 'finalizado'] as StatusFilter[]).map((status) => {
      const isActive = activeFilter === status;

      const textMap: Record<StatusFilter, string> = {
        em_adocao: 'Em adoção',
        escolhido: 'Escolhidos',
        rejeitado: 'Rejeitados',
        finalizado: 'Finalizados',
      };

      return (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${isActive ? 'bg-sky-600 text-white' : 'bg-muted/30 text-muted-foreground'
            }`}
        >
          {textMap[status]}
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full">
            {counts[status]}
          </span>
        </button>
      );
    })}
  </div>
);

interface MatchListProps {
  loading: boolean;
  matches: MatchItem[];
  error: string | null;
  onSeeAnimal: (animal: Animal) => void;
}

const MatchList: React.FC<MatchListProps> = ({ loading, matches, error, onSeeAnimal }) => {
  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Carregando...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-rose-600">{error}</div>;
  }

  if (matches.length === 0) {
    return <div className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((item) => (
        <MatchItemCard key={item.id} item={item} onSee={() => onSeeAnimal(item.animal)} />
      ))}
    </div>
  );
};

interface MatchItemCardProps {
  item: MatchItem;
  onSee: () => void;
}

const MatchItemCard = React.memo(({ item, onSee }: MatchItemCardProps) => {
  const { animal, status, created_at } = item;

  const img = animal.imagens?.[0]?.caminho;
  const idade = calcularIdade(animal.data_nascimento || '');
  const porte = animal.tamanho ?? '';

  const statusColor =
    status === 'escolhido' ? 'bg-emerald-100 text-emerald-700' :
      status === 'rejeitado' ? 'bg-rose-100 text-rose-700' :
        status === 'finalizado' ? 'bg-sky-100 text-sky-700' : 'bg-yellow-50 text-yellow-800';

  const statusText: Record<StatusFilter, string> = {
    em_adocao: 'Em adoção',
    escolhido: 'Escolhido',
    rejeitado: 'Rejeitado',
    finalizado: 'Finalizado',
  };

  return (
    <Card className="flex items-center gap-4 p-3 hover:shadow-lg transition-shadow">
      <div className="w-20 h-20 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
        <img src={`${process.env.NEXT_PUBLIC_API_URL}/imagens/` + img} alt={animal.nome} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold truncate">{animal.nome}</h4>
            <p className="text-sm text-muted-foreground truncate">{[idade, porte].filter(Boolean).join(' • ')}</p>
          </div>

          <div className="flex items-center gap-2 flex-col">
            <div className={`text-xs px-2 py-1 rounded-full ${statusColor} whitespace-nowrap`}>
              {statusText[status]}
            </div>
            <Button
              size='icon'
              onClick={onSee}
            >
              <Eye />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Pedido: {new Date(created_at ?? Date.now()).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </Card>
  );
});

MatchItemCard.displayName = 'MatchItemCard';


// --- Componente Principal da Página ---

export default function PainelAdotantePage() {
  const {
    filteredMatches,
    counts,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
  } = useAdotanteData();

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader />

      <FilterTabs
        counts={counts}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <MatchList
        loading={isLoading}
        matches={filteredMatches}
        error={error}
        onSeeAnimal={(animal) => setSelectedAnimal(animal)}
      />

      <AnimalDetailModal
        buttonAdotar={false}
        initialData={selectedAnimal}
        onClose={() => setSelectedAnimal(null)}
      />
    </div>
  );
}