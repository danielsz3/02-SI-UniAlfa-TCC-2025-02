'use client';

// Importações do React e Next.js
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// Importações de Componentes e Tipos
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calcularIdade } from '@/lib/animal-utils';
import { AnimalDetailModal } from '@/components/animal/AnimalDetailModal';
import { Animal } from '@/types';
import { getToken } from '@/lib/api';
import { ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';

// --- Configurações e Tipos ---

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const USER_KEY = 'user';

// Configuração de Chips/Badges fornecida
// Nota: Substituí 'primary.main' por '#1976d2' (azul padrão) para garantir que funcione no style inline
const chipTipos: Record<string, { label: string; bgCor: string; textCor: string }> = {
  disponivel: { label: 'Disponível', bgCor: '#1976d2', textCor: '#fff' },
  adotado: { label: 'Adotado', bgCor: '#9c27b0', textCor: '#fff' },
  em_adocao: { label: 'Em Adoção', bgCor: '#425a8fff', textCor: '#fff' },
  em_aprovacao: { label: 'Em Aprovação', bgCor: '#296b2c', textCor: '#fff' },
};

// Adicionamos 'anunciados' como um status virtual para a interface
type MatchStatus = 'em_adocao' | 'escolhido' | 'rejeitado' | 'finalizado' | 'anunciados';

type MatchItem = {
  id: number;
  status: MatchStatus;
  animal: Animal & { situacao?: string }; // Estendemos para garantir que o TS saiba que pode ter situacao
  observacao: string;
  created_at?: string | null;
  usuario_id: number;
  animal_id: number;
};

type User = { id: number;[key: string]: any };

type StatusFilter = MatchStatus;

const VALID_STATUSES: StatusFilter[] = [
  'em_adocao',
  'escolhido',
  'rejeitado',
  'finalizado',
  'anunciados',
];

// --- Serviço de API Centralizado ---

const apiService = {
  getToken: () => getToken(),

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
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

  // Busca Matches (Adoções)
  fetchMatches: async (userId: number): Promise<MatchItem[]> => {
    const filter = encodeURIComponent(JSON.stringify({ usuario_id: userId }));
    const order = encodeURIComponent(JSON.stringify(['created_at', 'DESC']));
    const json = await apiService.fetch(
      `/match-afinidades?filter=${filter}&order=${order}`
    );
    return Array.isArray(json) ? json : json.data ?? json.items ?? json ?? [];
  },

  // Busca Meus Anúncios (Animais cadastrados pelo usuário)
  fetchMyAnimals: async (userId: number): Promise<Animal[]> => {
    const filter = encodeURIComponent(JSON.stringify({ usuario_id: userId }));
    const order = encodeURIComponent(JSON.stringify(['updated_at', 'DESC']));
    const json = await apiService.fetch(
      `/animais?filter=${filter}&order=${order}`
    );
    return Array.isArray(json) ? json : json.data ?? json.items ?? json ?? [];
  },
};

// --- Hook Customizado ---

function useAdotanteData() {
  const [userId, setUserId] = useState<number | null>(null);
  const [allItems, setAllItems] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    // Executa as duas requisições em paralelo
    Promise.all([
      apiService.fetchMatches(userId),
      apiService.fetchMyAnimals(userId)
    ])
      .then(([matchesData, animalsData]) => {
        // Normaliza os dados dos animais para o formato MatchItem
        const formattedAnimals: MatchItem[] = animalsData.map((animal) => ({
          id: animal.id,
          status: 'anunciados',
          animal: animal,
          observacao: '',
          created_at: animal.created_at,
          usuario_id: userId,
          animal_id: animal.id,
        }));

        setAllItems([...matchesData, ...formattedAnimals]);
      })
      .catch((e) => {
        console.error('Erro ao buscar dados', e);
        setError(e.message || 'Falha ao carregar dados.');
        setAllItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const counts = useMemo(
    () => ({
      em_adocao: allItems.filter((m) => m.status === 'em_adocao').length,
      escolhido: allItems.filter((m) => m.status === 'escolhido').length,
      rejeitado: allItems.filter((m) => m.status === 'rejeitado').length,
      finalizado: allItems.filter((m) => m.status === 'finalizado').length,
      anunciados: allItems.filter((m) => m.status === 'anunciados').length,
    }),
    [allItems]
  );

  return { allItems, counts, isLoading: loading, error };
}

// --- Componentes de UI ---

const PageHeader = () => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-2xl font-semibold">Painel do Adotante</h3>
      <p className="text-sm text-muted-foreground font-medium dark:text-secondary">
        Gerencie seus pedidos, afinidades e anúncios
      </p>
    </div>
    <Button asChild>
      <a href="/adotar" className='text-wrap'>Animais disponíveis</a>
    </Button>
  </div>
);

interface FilterTabsProps {
  counts: Record<StatusFilter, number>;
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

const FilterTabs = ({ counts, activeFilter, onFilterChange }: FilterTabsProps) => (
  <div className="mb-6 flex items-center gap-3 flex-wrap">
    {(VALID_STATUSES).map((status) => {
      const isActive = activeFilter === status;
      const textMap: Record<StatusFilter, string> = {
        em_adocao: 'Em adoção',
        escolhido: 'Escolhidos',
        rejeitado: 'Rejeitados',
        finalizado: 'Finalizados',
        anunciados: 'Meus Anúncios',
      };
      
      const activeClass = isActive 
        ? 'bg-sky-600 text-white' 
        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50';

      return (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeClass}`}
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
  if (loading) return <div className="text-center py-20 text-muted-foreground">Carregando...</div>;
  if (error) return <div className="text-center py-20 text-rose-600">{error}</div>;
  if (matches.length === 0) return <div className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((item) => (
        <MatchItemCard
          key={`${item.status}-${item.id}`} // Key composta para evitar colisão de IDs entre tabelas
          item={item}
          onSee={() => onSeeAnimal(item.animal)}
        />
      ))}
    </div>
  );
};

interface MatchItemCardProps {
  item: MatchItem;
  onSee: () => void;
}

// --- Componente do Card (Lógica de Cores Aplicada Aqui) ---
const MatchItemCard = React.memo(({ item, onSee }: MatchItemCardProps) => {
  const { animal, status, created_at, observacao } = item;
  const img = animal.imagens?.[0]?.caminho;
  const idade = calcularIdade(animal.data_nascimento || '');
  const porte = animal.tamanho ?? '';

  // Variáveis para estilo dinâmico
  let badgeLabel = '';
  let badgeStyle: React.CSSProperties = {};
  let badgeClass = 'text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap';

  if (status === 'anunciados') {
    // === LÓGICA PARA ANÚNCIOS (Usa chipTipos) ===
    const situacaoKey = animal.situacao || 'em_aprovacao'; // Fallback
    const config = chipTipos[situacaoKey] || chipTipos['em_aprovacao'];

    badgeLabel = config.label;
    badgeStyle = {
      backgroundColor: config.bgCor,
      color: config.textCor,
    };
  } else {
    // === LÓGICA PARA MATCHES (Classes Tailwind padrão) ===
    const statusTextMap: Record<string, string> = {
      em_adocao: 'Em adoção',
      escolhido: 'Escolhido',
      rejeitado: 'Rejeitado',
      finalizado: 'Finalizado',
    };
    
    badgeLabel = statusTextMap[status] || status;

    if (status === 'escolhido') badgeClass += ' bg-emerald-600 text-white';
    else if (status === 'rejeitado') badgeClass += ' bg-rose-700 text-white';
    else if (status === 'finalizado') badgeClass += ' bg-sky-600 text-white';
    else badgeClass += ' bg-yellow-600 text-white';
  }

  return (
    <Card className="flex items-center gap-4 p-3 hover:shadow-lg transition-shadow w-full">
      <div className="w-20 h-20 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {img ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/imagens/` + img}
            alt={animal.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-xs text-muted-foreground">Sem foto</div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold truncate">{animal.nome}</h4>
            <p className="text-sm text-muted-foreground truncate text-wrap">
              {[idade, porte].filter(Boolean).join(' • ')}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === 'anunciados' ? 'Criado em: ' : 'Pedido: '}
              {new Date(created_at ?? Date.now()).toLocaleDateString('pt-BR')}
            </p>
            {observacao && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {observacao}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-col min-w-[20%]">
            {/* Badge de Status Dinâmico */}
            <div className={badgeClass} style={badgeStyle}>
              {badgeLabel}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="dark:text-white" onClick={onSee}>
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
      </div>
    </Card>
  );
});

MatchItemCard.displayName = 'MatchItemCard';

// --- Componente Principal ---

export default function PainelAdotantePage() {
  const { allItems, counts, isLoading, error } = useAdotanteData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlStatus = searchParams.get('status') as StatusFilter;
  const statusFilter = VALID_STATUSES.includes(urlStatus) ? urlStatus : 'em_adocao';

  const handleFilterChange = (newStatus: StatusFilter) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', newStatus);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filteredMatches = useMemo(
    () => allItems.filter((m) => m.status === statusFilter),
    [allItems, statusFilter]
  );

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader />

      <FilterTabs
        counts={counts}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
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