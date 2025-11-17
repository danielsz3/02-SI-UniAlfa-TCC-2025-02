import * as React from 'react';
import { FC, useMemo } from 'react';
import { Link, Loading, Tab, useRedirect } from 'react-admin';
import {
    Grid,
    Alert,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Avatar,
    Stack,
    TableFooter,
    Button,
    Chip
} from '@mui/material';
import { endOfDay, format, formatISO, startOfDay } from 'date-fns';
import SimplePieChart from './SimplePieChart';
import { Adocao, PieData, Transacao } from '../types';
import { useApiSearch } from '../hooks/useApiSearch';
import { Situacao } from 'src/components/animais/AnimalList';
import { red } from '@mui/material/colors';
import MetricCard from './MetricCard';
import { formatCurrency } from '../utils/formatter';
import CategoryTable from './CategoryTable';
import SimpleAreaChart from './SimpleAreaChart';

interface TransacoesTabProps {
    startDate: Date | null;
    endDate: Date | null;
}

// --- Constantes de Cor ---
const COLORS_TRANSACOES = ['#0088FE', '#00C49F', '#f0b12a', '#FF8042', '#8884d8'];
const COLORS_TIPOS = ['#F44336', '#4CAF50'];



// --- Componente da Aba ---
export const TransacoesTab = ({ startDate, endDate }: TransacoesTabProps) => {


    const redirect = useRedirect();
    const pagination = useMemo(() => ({ page: 1, perPage: 9999 }), []);

    const filter = useMemo(() => {
        let from_date: string | null = null;
        let to_date: string | null = null;

        try {
            if (startDate) {
                from_date = formatISO(startOfDay(startDate));
            }
            if (endDate) {
                to_date = formatISO(endOfDay(endDate));
            }
        } catch (e) {
            console.error("Erro ao formatar datas ISO:", e);
        }

        return {
            created_at_from: from_date,
            created_at_to: to_date,
        };
    }, [startDate, endDate]);

    // Ordena pelos mais recentes. As tabelas vão reusar essa ordem.
    const sort = useMemo(() => ({
        field: 'created_at',
        order: 'DESC' as 'DESC'
    }), []);

    // 2. A BUSCA PRINCIPAL
    // Traz todos os animais que se encaixam no filtro de data.
    const {
        data: allTransacoes,
        isLoading,
        isError,
        error
    } = useApiSearch<Transacao>(
        'transacoes', // Seu endpoint de lista de animais
        pagination,
        sort,
        filter
    );

    const recenteTransacoes: Transacao[] = useMemo(() => {
        if (!allTransacoes) return [];
        return allTransacoes.slice(0, 10);
    }, [allTransacoes]);


    const statusNameMap = {
        concluido: 'Concluído',
        pendente: 'Pendente',
        cancelado: 'Cancelado',
    };

    const statusPieData = useMemo<PieData[]>(() => {
        if (!allTransacoes) return [];

        const counts = allTransacoes.reduce((acc: { [x: string]: any; }, transacao: { situacao: string; }) => {
            const status = transacao.situacao || 'indefinido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Formata para o gráfico
        return Object.entries(counts).map(([name, value]) => ({ name: statusNameMap[name as keyof typeof statusNameMap] || name, value: value as number }));
    }, [allTransacoes]);

    const tipoNameMap = {
        receita: 'Receita',
        despesa: 'Despesa',
    };

    const tipoPieData = useMemo<PieData[]>(() => {
        if (!allTransacoes) return [];

        const counts = allTransacoes.reduce((acc: { [x: string]: any; }, transacao: { tipo: string; }) => {
            const status = transacao.tipo || 'indefinido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Formata para o gráfico
        return Object.entries(counts).map(([name, value]) => ({ name: tipoNameMap[name as keyof typeof tipoNameMap] || name, value }));
    }, [allTransacoes]);


    // --- Renderização ---
    if (isLoading) return <Loading />;
    if (isError) return <Alert severity="error">{(error as Error).message}</Alert>;

    return (
        <Grid container spacing={3}>

            <Grid size={{ xs: 12, sm: 4 }}>
                <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
                    <MetricCard
                        title="Total Transações"
                        value={allTransacoes?.length || 0}
                        description='Todos as transações no período'
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <MetricCard
                        title="Animais envolvidos"
                        value={0 || 0}
                        description='Animais únicos que estão em processo de adoção'
                    />
                </Grid>
            </Grid>

            <Grid size={{ xs: 12, sm: 8 }}>
                <SimplePieChart
                    height={200}
                    data={statusPieData}
                    colors={COLORS_TRANSACOES}
                    title="Status das Transações"
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="h6" gutterBottom>Transações Recentes</Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Valor</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Categoria</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recenteTransacoes.map(transacao => (
                                <TableRow key={transacao.id} component={Link} to={`/transacoes/${transacao.id}`}
                                    sx={{
                                        ":hover": { backgroundColor: '#e3f2fd', cursor: 'pointer' },
                                        textDecoration: 'none'
                                    }}
                                >
                                    <TableCell>
                                        {format(new Date(transacao.created_at), 'dd/MM/yyyy HH:mm')}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(transacao.valor)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip size='small' variant='outlined' sx={{ textTransform: 'capitalize', fontWeight: 'bold' }} label={transacao.tipo} color={transacao.tipo === 'receita' ? 'success' : 'error'} />
                                    </TableCell>
                                    <TableCell>
                                        {transacao.categoria}
                                    </TableCell>
                                    <TableCell>
                                        <Chip size='small' sx={{ textTransform: 'capitalize', fontWeight: 'bold' }} label={transacao.situacao} color={transacao.situacao === 'concluido' ? 'success' : transacao.situacao === 'pendente' ? 'warning' : 'error'} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5} align="right">
                                    <Button component={Link}
                                        to={`/transacoes?filter=${encodeURIComponent(JSON.stringify({ ...filter }))}?sort=created_at`}
                                        variant="outlined"
                                        color="primary"
                                        size='small'
                                    >
                                        Ver Todos ({allTransacoes?.length})
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <SimplePieChart
                    height={350}
                    data={tipoPieData}
                    colors={COLORS_TIPOS}
                    title="Status das Transações"
                />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <SimpleAreaChart
                    title="Fluxo de Caixa"
                    transactions={allTransacoes || []}
                />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <CategoryTable
                    title="Resultado por Categoria (Concluído)"
                    transactions={allTransacoes || []}
                />
            </Grid>

        </Grid >
    );
};