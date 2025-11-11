import * as React from 'react';
import { useState, useMemo, FC } from 'react';
// Importações corrigidas: 'Error' (não 'OnError') e 'Title' e 'Loading'
import { OnError as RaError} from 'ra-core';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // Usando date-fns
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
    useQuery,
    QueryFunctionContext,
    keepPreviousData
} from '@tanstack/react-query'; // React Admin usa react-query por baixo dos panos
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieLabelRenderProps,
} from 'recharts';
import { subDays, format } from 'date-fns'; // Para datas padrão
import { ptBR } from 'date-fns/locale'; // Para localização em português
import { Loading, Title } from 'react-admin';

// --- Cores para os Gráficos ---
const COLORS_ANIMAIS = ['#0088FE', '#00C49F', '#FFBB28'];
const COLORS_ADOCOES = ['#4CAF50', '#FFC107', '#F44336'];
const COLORS_CASTRADOS = ['#0088FE', '#FF8042'];

// --- Definições de Tipos ---

// Tipo para os dados do gráfico de pizza
type PieData = {
    name: string;
    value: number;
};

// Tipo para a resposta da API do dashboard
interface DashboardData {
    periodo: {
        inicio: string;
        fim: string;
    };
    usuarios: {
        ativos: number;
        novos: number;
        taxa_conversao: number;
    };
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
    eventos: {
        total: number;
        impacto_adocoes_percentual: number;
    };
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

// --- Função Helper para Formatar Datas ---
const formatDate = (date: Date | null): string | null => {
    if (!date || !(date instanceof Date)) return null;
    try {
        return format(date, 'yyyy-MM-dd');
    } catch (error) {
        console.error('Data inválida:', date, error);
        return null;
    }
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
                                // Evita mostrar label para fatias muito pequenas
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
                            formatter={(value: number, name: string) => [value, name]}
                            wrapperStyle={{ zIndex: 1100 }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

// --- Função de Busca de Dados ---
const fetchDashboardData = async ({
    queryKey,
}: QueryFunctionContext<
    [string, string | null, string | null]
>): Promise<DashboardData> => {
    const [_key, startDate, endDate] = queryKey;

    if (!startDate || !endDate) {
        throw new Error('Datas de início e fim são obrigatórias.');
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('Token não encontrado. A chamada de API será simulada.');
    }

    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
    });

    const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
            message?: string;
        };
        throw new Error(
            errorData.message ||
            `Falha ao buscar dados do dashboard (Status: ${response.status})`
        );
    }

    return response.json() as Promise<DashboardData>;
};

// --- Componente Principal do Dashboard ---
export const Dashboard: FC = () => {
    const [startDate, setStartDate] = useState<Date | null>(
        subDays(new Date(), 30)
    );
    const [endDate, setEndDate] = useState<Date | null>(new Date());

    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

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

    

    // --- Transformação de Dados para Gráficos ---
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


    if (isLoading && !data) {
        return <Loading />;
    }

    if (isError) {
        return <></>;
    }

    // --- Renderização ---
    return (
        <Box m={{ xs: 1, sm: 2 }} mt={2}>
            <Title title="Dashboard" />

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
                            <Typography variant="body1" color="text.secondary">
                                Exibindo dados de {data.periodo.inicio} até {data.periodo.fim}.
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </LocalizationProvider>

            {isLoading && data && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Atualizando dados...
                </Alert>
            )}

            {data && (
                <>
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

                    {/* Gráficos de Pizza */}
                    <Typography variant="h5" gutterBottom>
                        Análise Visual
                    </Typography>
                    <Grid container spacing={3}>
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
                                title="Status das Adoções (Total)"
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
        </Box>
    );
};

export default Dashboard;