import * as React from 'react';
import { useState, useMemo, FC } from 'react';
// Importações de ra-core e react-admin
import { OnError as RaError } from 'ra-core';
import { Loading, Title } from 'react-admin';

// Importações de @mui/material
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Alert,
    // Componentes da Tabela
    Table as MuiTable,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TableSortLabel,
    TableFooter,
} from '@mui/material';

// Importações de @mui/x-date-pickers (Filtros de Data)
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Importações de @tanstack/react-query (Busca de Dados)
import {
    useQuery,
    QueryFunctionContext,
    keepPreviousData,
} from '@tanstack/react-query';

// Importações de recharts (Gráficos)
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieLabelRenderProps,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

// Importações de date-fns (Manipulação de Datas)
import { subDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Cores para os Gráficos ---
const COLORS_ANIMAIS = ['#0088FE', '#00C49F', '#FFBB28'];
const COLORS_ADOCOES = ['#4CAF50', '#FFC107', '#F44336'];
const COLORS_CASTRADOS = ['#0088FE', '#FF8042'];
const COLORS_TRANSACOES = {
    entradas: '#4CAF50',
    saidas: '#F44336',
};

// --- Definições de Tipos ---

// Tipo para os dados do gráfico de pizza
type PieData = {
    name: string;
    value: number;
};

// Tipo para a resposta da API do dashboard principal (métricas)
interface DashboardData {
    periodo: { inicio: string; fim: string; };
    usuarios: { ativos: number; novos: number; taxa_conversao: number; };
    animais: { total: number; disponiveis: number; adotados: number; em_adocao: number; castrados: number; nao_castrados: number; };
    adocoes: { total: number; concluidas: number; em_aberto: number; negadas: number; no_periodo: number; };
    eventos: { total: number; impacto_adocoes_percentual: number; };
}

// Tipo para a transação *bruta* vinda da API
interface ApiRawTransaction {
    id: number;
    tipo: 'receita' | 'despesa';
    valor: string; // Vem como string!
    data: string;  // Vem como string ISO
    categoria: string;
    situacao: 'concluido' | 'pendente' | 'cancelado';
}

// Tipo para os dados de transação (Gráfico de Área)
interface TransactionDataPoint {
    data: string;
    entradas: number;
    saidas: number;
}

// Tipo para os dados da tabela de categorias
interface CategoryDataPoint {
    categoria: string;
    receitas: number;
    despesas: number;
    resultado: number;
}

// Props para o MetricCard
interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
}

// Props para o SimplePieChart
interface SimplePieChartProps {
    data: PieData[];
    colors: string[];
    title: string;
}

// Props para o SimpleAreaChart
interface SimpleAreaChartProps {
    data: TransactionDataPoint[];
    title: string;
}

// Props para a Tabela de Categorias
interface CategoryTableProps {
    data: CategoryDataPoint[];
    title: string;
}

// Tipo para ordenação da tabela
type Order = 'asc' | 'desc';
type CategoryDataKey = keyof CategoryDataPoint;


// --- Funções Helper ---

/**
 * Formata um objeto Date para uma string 'yyyy-MM-dd'.
 */
const formatDate = (date: Date | null): string | null => {
    if (!date || !(date instanceof Date)) return null;
    try {
        return format(date, 'yyyy-MM-dd');
    } catch (error) {
        console.error('Data inválida:', date, error);
        return null;
    }
};

/**
 * Formata um número para moeda BRL (R$).
 */
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// --- Componente de Cartão de Métrica ---
const MetricCard: FC<MetricCardProps> = ({ title, value, description }) => (
    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
            <Typography
                variant="h4"
                component="div"
                fontWeight="bold"
                color="primary"
            >
                {value}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            )}
        </CardContent>
    </Card>
);

// --- Componente de Gráfico de Pizza ---
const SimplePieChart: FC<SimplePieChartProps> = ({ data, colors, title }) => (
    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
            <Typography variant="h6" gutterBottom align="center">
                {title}
            </Typography>
            <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }: PieLabelRenderProps) =>
                                percent && percent > 0.05
                                    ? `${name} (${(percent * 100).toFixed(0)}%)`
                                    : ''
                            }
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                value,
                                name,
                            ]}
                            wrapperStyle={{ zIndex: 1100 }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

// --- Componente de Gráfico de Área ---
const SimpleAreaChart: FC<SimpleAreaChartProps> = ({ data, title }) => (
    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
            <Typography variant="h6" gutterBottom align="center">
                {title}
            </Typography>
            <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 50,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            wrapperStyle={{ zIndex: 1100 }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="entradas"
                            stroke={COLORS_TRANSACOES.entradas}
                            fill={COLORS_TRANSACOES.entradas}
                            fillOpacity={0.6}
                            name="Entradas"
                        />
                        <Area
                            type="monotone"
                            dataKey="saidas"
                            stroke={COLORS_TRANSACOES.saidas}
                            fill={COLORS_TRANSACOES.saidas}
                            fillOpacity={0.6}
                            name="Saídas"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

// --- Componente de Tabela de Categorias ---
const CategoryTable: FC<CategoryTableProps> = ({ data, title }) => {
    // --- Lógica de Ordenação ---
    const [order, setOrder] = useState<Order>('desc');
    const [orderBy, setOrderBy] = useState<CategoryDataKey>('resultado');

    const handleRequestSort = (property: CategoryDataKey) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const getComparator = (
        order: Order,
        orderBy: CategoryDataKey
    ): ((a: CategoryDataPoint, b: CategoryDataPoint) => number) => {
        return order === 'desc'
            ? (a, b) => (b[orderBy] < a[orderBy] ? -1 : 1)
            : (a, b) => (a[orderBy] < b[orderBy] ? -1 : 1);
    };

    const sortedData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return [...data].sort(getComparator(order, orderBy));
    }, [data, order, orderBy]);

    const totalReceitas = useMemo(() => {
        return sortedData.reduce((sum, current) => sum + current.receitas, 0);
    }, [sortedData]);

    const totalDespesas = useMemo(() => {
        return sortedData.reduce((sum, current) => sum + current.despesas, 0);
    }, [sortedData]);

    const totalResultado = useMemo(() => {
        return totalReceitas - totalDespesas;
    }, [totalReceitas, totalDespesas]);

    // --- Fim da Lógica de Ordenação ---

    return (
        <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                    {title}
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                    <MuiTable stickyHeader aria-label="Tabela de categorias">
                        <TableHead>
                            <TableRow>
                                <TableCell sortDirection={orderBy === 'categoria' ? order : false}>
                                    <TableSortLabel
                                        active={orderBy === 'categoria'}
                                        direction={orderBy === 'categoria' ? order : 'asc'}
                                        onClick={() => handleRequestSort('categoria')}
                                    >
                                        Categoria
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sortDirection={orderBy === 'receitas' ? order : false}>
                                    <TableSortLabel
                                        active={orderBy === 'receitas'}
                                        direction={orderBy === 'receitas' ? order : 'asc'}
                                        onClick={() => handleRequestSort('receitas')}
                                    >
                                        Receitas
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sortDirection={orderBy === 'despesas' ? order : false}>
                                    <TableSortLabel
                                        active={orderBy === 'despesas'}
                                        direction={orderBy === 'despesas' ? order : 'asc'}
                                        onClick={() => handleRequestSort('despesas')}
                                    >
                                        Despesas
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sortDirection={orderBy === 'resultado' ? order : false}>
                                    <TableSortLabel
                                        active={orderBy === 'resultado'}
                                        direction={orderBy === 'resultado' ? order : 'asc'}
                                        onClick={() => handleRequestSort('resultado')}
                                    >
                                        Resultado
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((row) => (
                                <TableRow key={row.categoria}>
                                    <TableCell component="th" scope="row">
                                        {row.categoria} - 
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'success.dark' }}>
                                        {formatCurrency(row.receitas)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'error.dark' }}>
                                        {formatCurrency(row.despesas)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: row.resultado >= 0 ? 'success.dark' : 'error.dark',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {formatCurrency(row.resultado)}
                                    </TableCell>
                                </TableRow>
                            ))}

                            <TableRow sx={{ backgroundColor: '#f4f4f4' }}>
                                <TableCell component="th" scope="row">
                                    Totais
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'success.dark' }}>
                                    {formatCurrency(totalReceitas)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'error.dark' }}>
                                    {formatCurrency(totalDespesas)}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        color: totalResultado >= 0 ? 'success.dark' : 'error.dark',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {formatCurrency(totalResultado)}
                                </TableCell>
                            </TableRow>

                        </TableBody>
                    </MuiTable>
                </TableContainer>
            </CardContent>
        </Card>
    )
}

// --- Função de Busca de Dados (Principal) ---
const fetchDashboardData = async ({
    queryKey,
}: QueryFunctionContext<
    [string, string | null, string | null]
>): Promise<DashboardData> => {
    const [_key, startDate, endDate] = queryKey;
    if (!startDate || !endDate) { throw new Error('Datas são obrigatórias.'); }
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message || `Falha ao buscar dados do dashboard (Status: ${response.status})`);
    }
    return response.json() as Promise<DashboardData>;
};

// --- Função de Busca de Dados (Transações Brutas) ---
const fetchRawTransactions = async ({
    queryKey,
}: QueryFunctionContext<
    [string, string | null, string | null]
>): Promise<ApiRawTransaction[]> => { // Retorna a lista bruta
    const [_key, startDate, endDate] = queryKey;

    if (!startDate || !endDate) {
        throw new Error('Datas de início e fim são obrigatórias.');
    }

    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
    });

    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/transacoes?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        }
    );

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(
            errorData.message ||
            `Falha ao buscar dados de transações (Status: ${response.status})`
        );
    }

    const rawData = (await response.json()) as ApiRawTransaction[];

    if (!Array.isArray(rawData)) {
        console.warn('API de transações não retornou um array:', rawData);
        return [];
    }

    return rawData;
};

// --- Componente Principal do Dashboard ---
export const Dashboard: FC = () => {
    const [startDate, setStartDate] = useState<Date | null>(
        subDays(new Date(), 30)
    );
    const [endDate, setEndDate] = useState<Date | null>(new Date());

    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    // --- Query 1: Dados Principais (Métricas) ---
    type DashboardQueryKey = [string, string | null, string | null];
    const queryKey: DashboardQueryKey = ['dashboard', formattedStart, formattedEnd];

    const { data, isLoading, error, isError } = useQuery<
        DashboardData,
        Error,
        DashboardData,
        DashboardQueryKey
    >({
        queryKey: queryKey,
        queryFn: fetchDashboardData,
        enabled: !!formattedStart && !!formattedEnd,
        placeholderData: keepPreviousData,
        retry: 2,
    });

    // --- Query 2: Dados Brutos de Transações ---
    type RawTransactionsQueryKey = [string, string | null, string | null];
    const rawTransactionsQueryKey: RawTransactionsQueryKey = [
        'rawTransactions',
        formattedStart,
        formattedEnd,
    ];

    const {
        data: rawTransactions,
        isLoading: isTransactionsLoading,
        error: transactionsError,
        isError: isTransactionsError,
    } = useQuery<
        ApiRawTransaction[],
        Error,
        ApiRawTransaction[],
        RawTransactionsQueryKey
    >({
        queryKey: rawTransactionsQueryKey,
        queryFn: fetchRawTransactions, // Busca os dados brutos
        enabled: !!formattedStart && !!formattedEnd,
        placeholderData: keepPreviousData,
        retry: 2,
    });

    // --- Transformação de Dados (Processamento Client-Side) ---

    // 1. Pré-processa as transações: filtra por "concluido" e converte valores
    const processedTransactions = useMemo(() => {
        if (!rawTransactions) return [];

        return rawTransactions
            .filter(t => t.situacao === 'concluido')
            .map(t => ({
                ...t,
                valor: parseFloat(t.valor) || 0,
                dataAgrupada: format(parseISO(t.data), 'yyyy-MM-dd'),
            }));
    }, [rawTransactions]);

    // 2. Transforma para o Gráfico de Área (agrupado por data)
    const areaChartData = useMemo<TransactionDataPoint[]>(() => {
        if (!processedTransactions) return [];

        const groupedByDate = processedTransactions.reduce((acc, t) => {
            const dateKey = t.dataAgrupada;

            if (!acc[dateKey]) {
                acc[dateKey] = { data: dateKey, entradas: 0, saidas: 0 };
            }

            if (t.tipo === 'receita') {
                acc[dateKey].entradas += t.valor;
            } else if (t.tipo === 'despesa') {
                acc[dateKey].saidas += t.valor;
            }

            return acc;
        }, {} as Record<string, TransactionDataPoint>);

        return Object.values(groupedByDate).sort((a, b) => a.data.localeCompare(b.data));

    }, [processedTransactions]);

    // 3. Transforma para a Tabela de Categorias (agrupado por categoria)
    const categoryTableData = useMemo<CategoryDataPoint[]>(() => {
        if (!processedTransactions) return [];

        const groupedByCategory = processedTransactions.reduce((acc, t) => {
            const categoryKey = t.categoria;

            if (!acc[categoryKey]) {
                acc[categoryKey] = { categoria: categoryKey, receitas: 0, despesas: 0, resultado: 0 };
            }

            if (t.tipo === 'receita') {
                acc[categoryKey].receitas += t.valor;
            } else if (t.tipo === 'despesa') {
                acc[categoryKey].despesas += t.valor;
            }

            return acc;
        }, {} as Record<string, CategoryDataPoint>);

        return Object.values(groupedByCategory).map(c => ({
            ...c,
            resultado: c.receitas - c.despesas,
        }));

    }, [processedTransactions]);


    // --- Transformação de Dados (Gráficos de Pizza) ---
    const animalStatusData = useMemo<PieData[]>(() => {
        if (!data) return [];
        return [
            { name: 'Disponíveis', value: data.animais.disponiveis },
            { name: 'Adotados', value: data.animais.adotados },
            { name: 'Em Adoção', value: data.animais.em_adocao },
        ];
    }, [data]);

    const adoptionStatusData = useMemo<PieData[]>(() => {
        if (!data) return [];
        return [
            { name: 'Concluídas', value: data.adocoes.concluidas },
            { name: 'Em Aberto', value: data.adocoes.em_aberto },
            { name: 'Negadas', value: data.adocoes.negadas },
        ];
    }, [data]);

    const castrationData = useMemo<PieData[]>(() => {
        if (!data) return [];
        return [
            { name: 'Castrados', value: data.animais.castrados },
            { name: 'Não Castrados', value: data.animais.nao_castrados },
        ];
    }, [data]);


    // --- Tratamento de Loading e Erro ---
    if (isLoading && !data) {
        return <Loading />;
    }

    if (isError) {
        return < ></>;
    }

    // --- Renderização ---
    return (
        <Box m={{ xs: 1, sm: 2 }} mt={2}>
            <Title title="Dashboard" />

            {/* Seção de Filtros de Data */}
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <Grid container spacing={2} mb={3} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DatePicker
                            label="Data de Início"
                            value={startDate}
                            onChange={(newValue: Date | null) => setStartDate(newValue)}
                            slotProps={{
                                textField: { fullWidth: true, variant: 'outlined' },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DatePicker
                            label="Data de Fim"
                            value={endDate}
                            onChange={(newValue: Date | null) => setEndDate(newValue)}
                            minDate={startDate || undefined}
                            slotProps={{
                                textField: { fullWidth: true, variant: 'outlined' },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        {data && (
                            <>
                                <Typography variant="body1" color="text.secondary">
                                    Exibindo dados de {data.periodo.inicio} até {data.periodo.fim}.
                                </Typography>
                            </>
                        )}
                    </Grid>
                </Grid>
            </LocalizationProvider>

            {/* Alerta de "Atualizando" */}
            {(isLoading && data) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Atualizando dados...
                </Alert>
            )}

            {/* Renderiza o conteúdo principal se os dados existirem */}
            {data && (
                <>
                    {/* Seção de Métricas Principais */}
                    <Typography variant="h5" gutterBottom>
                        Métricas Principais
                    </Typography>
                    <Grid container spacing={3} mb={4}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <MetricCard
                                title="Usuários Ativos (Total)"
                                value={data.usuarios.ativos}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <MetricCard
                                title="Novos Usuários (Período)"
                                value={data.usuarios.novos}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <MetricCard
                                title="Adoções Concluídas (Total)"
                                value={data.adocoes.concluidas}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <MetricCard
                                title="Taxa de Conversão (Total)"
                                value={`${data.usuarios.taxa_conversao}%`}
                                description="Adoções / Usuários"
                            />
                        </Grid>
                    </Grid>

                    {/* Seção de Gráficos de Pizza */}
                    <Typography variant="h5" gutterBottom>
                        Análise Visual
                    </Typography>
                    <Grid container spacing={3} mb={4}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SimplePieChart
                                data={animalStatusData}
                                colors={COLORS_ANIMAIS}
                                title="Status dos Animais (Total)"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SimplePieChart
                                data={adoptionStatusData}
                                colors={COLORS_ADOCOES}
                                title="Status das Adoções"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SimplePieChart
                                data={castrationData}
                                colors={COLORS_CASTRADOS}
                                title="Animais Castrados (Total)"
                            />
                        </Grid>
                    </Grid>
                </>
            )}

            {/* Seção do Gráfico de Transações (Gráfico de Área) */}
            <Typography variant="h5" gutterBottom>
                Análise Financeira
            </Typography>
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12 }}>
                    {isTransactionsLoading && (
                        <Card
                            sx={{
                                boxShadow: 3,
                                borderRadius: 2,
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 360,
                            }}
                        >
                            <Loading />
                        </Card>
                    )}
                    {isTransactionsError && (
                        <Alert severity="error">
                            Não foi possível carregar os dados de transações:{' '}
                            {transactionsError?.message}
                        </Alert>
                    )}
                    {areaChartData && !isTransactionsLoading && (
                        <SimpleAreaChart
                            data={areaChartData}
                            title="Entradas vs. Saídas (Concluídas)"
                        />
                    )}
                </Grid>
            </Grid>

            {/* Seção da Tabela de Categorias */}
            <Typography variant="h5" gutterBottom>
                Análise por Categoria
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    {isTransactionsLoading && (
                        <Card
                            sx={{
                                boxShadow: 3,
                                borderRadius: 2,
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 360,
                            }}
                        >
                            <Loading />
                        </Card>
                    )}
                    {isTransactionsError && ( // Reutiliza o mesmo erro
                        <Alert severity="error">
                            Não foi possível carregar os dados de categorias:{' '}
                            {transactionsError?.message}
                        </Alert>
                    )}
                    {/* Renderiza a tabela com os dados transformados (categoryTableData) */}
                    {categoryTableData && !isTransactionsLoading && (
                        <CategoryTable
                            data={categoryTableData}
                            title="Resultado por Categoria (Concluído)"
                        />
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;