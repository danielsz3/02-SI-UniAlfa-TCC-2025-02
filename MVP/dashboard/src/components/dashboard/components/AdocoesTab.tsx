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
    Button
} from '@mui/material';
import { endOfDay, format, formatISO, startOfDay } from 'date-fns';
import SimplePieChart from './SimplePieChart';
import { Adocao, Animal, PieData } from '../types';
import { useApiSearch } from '../hooks/useApiSearch';
import { Situacao } from 'src/components/animais/AnimalList';
import { red } from '@mui/material/colors';
import MetricCard from './MetricCard';

interface AdocoesTabProps {
    startDate: Date | null;
    endDate: Date | null;
}

// --- Constantes de Cor ---
const COLORS_AOCOES = ['#0088FE', '#00C49F', '#f0b12a', '#FF8042', '#8884d8'];

// --- Componente da Aba ---
export const AdocoesTab = ({ startDate, endDate }: AdocoesTabProps) => {

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
        data: allAdocoes,
        isLoading,
        isError,
        error
    } = useApiSearch<Adocao>(
        'adocoes', // Seu endpoint de lista de animais
        pagination,
        sort,
        filter
    );

    const countAnimaisAdocao = useMemo(() => {
        if (!allAdocoes) return 0;
        const animalIds = allAdocoes.map(a => a.animal_id);
        const uniqueAnimalIds = Array.from(new Set(animalIds));
        return uniqueAnimalIds.length;
    }, [allAdocoes]);

    const recenteAdocoes: Adocao[] = useMemo(() => {
        if (!allAdocoes) return [];
        return allAdocoes.slice(0, 10);
    }, [allAdocoes]);


    const statusNameMap = {
        aprovado: 'Aprovado',
        em_aprovacao: 'Em Aprovação',
        negado: 'Negado',
    };

    const statusPieData = useMemo<PieData[]>(() => {
        if (!allAdocoes) return [];

        const counts = allAdocoes.reduce((acc: { [x: string]: any; }, adocao: { status: string; }) => {
            const status = adocao.status || 'indefinido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Formata para o gráfico
        return Object.entries(counts).map(([name, value]) => ({ name: statusNameMap[name as keyof typeof statusNameMap] || name, value: value as number }));
    }, [allAdocoes]);


    // --- Renderização ---
    if (isLoading) return <Loading />;
    if (isError) return <Alert severity="error">{(error as Error).message}</Alert>;

    return (
        <Grid container spacing={3}>

            <Grid size={{ xs: 12, sm: 4 }}>
                <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
                    <MetricCard
                        title="Total Adoções"
                        value={allAdocoes?.length || 0}
                        description='Todos as adoções no período'
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <MetricCard
                        title="Animais envolvidos"
                        value={countAnimaisAdocao || 0}
                        description='Animais únicos que estão em processo de adoção'
                    />
                </Grid>
            </Grid>

            {/* Linha 1: Os Gráficos */}
            <Grid size={{ xs: 12, sm: 8 }}>
                <SimplePieChart
                    height={200}
                    data={statusPieData}
                    colors={COLORS_AOCOES}
                    title="Status das Adoções"
                />
            </Grid>

            {/* Linha 2: As Tabelas */}
            <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>Adoções Recentes</Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Animal</TableCell>
                                <TableCell>Adotante</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Data</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recenteAdocoes.map(adocao => (
                                <TableRow key={adocao.id} component={Link} to={`/adocoes/${adocao.id}/show`}
                                    sx={{
                                        ":hover": { backgroundColor: '#e3f2fd', cursor: 'pointer' },
                                        textDecoration: 'none'
                                    }}
                                >
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar
                                                src={
                                                    (adocao.animal.imagens && adocao.animal.imagens.length > 0)
                                                        ? (import.meta.env.VITE_API_URL + '/imagens/' + adocao.animal.imagens[0].caminho)
                                                        : undefined
                                                }
                                            />
                                            <p>{adocao.animal.nome}</p>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar
                                                src={
                                                    (adocao.usuario.imagem)
                                                        ? (import.meta.env.VITE_API_URL + '/imagens/' + adocao.usuario.imagem)
                                                        : undefined
                                                }
                                            />
                                            <p>{adocao.usuario.nome}</p>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{adocao.status}</TableCell>
                                    <TableCell>
                                        {format(new Date(adocao.created_at), 'dd/MM/yyyy HH:mm')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} align="right">
                                    <Button component={Link}
                                        to={`/adocoes?filter=${encodeURIComponent(JSON.stringify({ ...filter }))}?sort=created_at`}
                                        variant="outlined"
                                        color="primary"
                                        size='small'
                                    >
                                        Ver Todos ({allAdocoes?.length})
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Grid>

        </Grid >
    );
};