// Todos os tipos que você definiu, agora exportáveis.

export type PieData = {
    name: string;
    value: number;
};

export interface DashboardData {
    periodo: { inicio: string; fim: string };
    usuarios: { ativos: number; novos: number; taxa_conversao: number };
    animais: {
        total: number;
        disponiveis: number;
        adotados: number;
        em_adocao: number;
        castrados: number;
        nao_castrados: number;
    };
    adocoes: {
        total: number;
        concluidas: number;
        em_aberto: number;
        negadas: number;
        no_periodo: number;
    };
    eventos: { total: number; impacto_adocoes_percentual: number };
}

export interface ApiRawTransaction {
    id: number;
    tipo: 'receita' | 'despesa';
    valor: string;
    data: string;
    categoria: string;
    situacao: 'concluido' | 'pendente' | 'cancelado';
}

export interface TransactionDataPoint {
    data: string;
    entradas: number;
    saidas: number;
}

export interface CategoryDataPoint {
    categoria: string;
    receitas: number;
    despesas: number;
    resultado: number;
}

export interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
}

export interface SimplePieChartProps {
    data: PieData[];
    colors: string[];
    title: string;
    height?: number;
}

export interface SimpleAreaChartProps {
    data: TransactionDataPoint[];
    title: string;
}

export interface CategoryTableProps {
    data: CategoryDataPoint[];
    transactionCounts: Record<string, number>;
    totalTransactions: number;
    title: string;
}

export interface Animal {
    id: number;
    nome: string;
    situacao: 'disponivel' | 'adotado' | 'em_aprovacao' | 'em_adocao'; 
    castrado: boolean;
    created_at: string; 
    tipo_animal?: string;
    imagens?: Image[];
    lar_temporario_id?: number;
    fica_usuario?: boolean;
}

export interface LarTemp {
    id: number;
    nome: string;
    situacao: 'ativo' | 'inativo';
    animais: Animal[];
    imagens: Image[];
    created_at: string;
    data_nascimento: string;
}

export interface Adocao {
    id: number;
    animal_id: number;
    usuario_id: number;
    created_at: string;
    animal: Animal;
    usuario: any;
    status: 'em_aprovacao' | 'aprovado' | 'negado';
}

export interface Image {
    id: string;
    file: File;
    caminho: string;
    width: number;
    height: number;
    isValid: boolean;
    title: string;
}