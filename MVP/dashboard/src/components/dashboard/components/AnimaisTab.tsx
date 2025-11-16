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
import { Animal, PieData } from '../types';
import { useApiSearch } from '../hooks/useApiSearch';
import { Situacao } from 'src/components/animais/AnimalList';
import { red } from '@mui/material/colors';
import MetricCard from './MetricCard';

interface AnimaisTabProps {
    startDate: Date | null;
    endDate: Date | null;
}



// --- Constantes de Cor ---
const COLORS_ANIMAIS = ['#0088FE', '#00C49F', '#f0b12a', '#FF8042', '#8884d8'];
const COLORS_CASTRADOS = ['#1b8f59', '#42b3ff'];

// --- Componente da Aba ---
export const AnimaisTab = ({ startDate, endDate }: AnimaisTabProps) => {

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
        data: allAnimals,
        isLoading,
        isError,
        error
    } = useApiSearch<Animal>(
        'animais', // Seu endpoint de lista de animais
        pagination,
        sort,
        filter
    );

    const animalsLares = useMemo(() => {
        if (!allAnimals) return [];
        return allAnimals.filter(a => a.lar_temporario_id && a.situacao !== 'em_aprovacao' && a.situacao !== 'adotado');
    }, [allAnimals]);

    const animalsComAdotantes = useMemo(() => {
        if (!allAnimals) return [];
        return allAnimals.filter(a => a.situacao == 'adotado' || (a.fica_usuario === true && a.lar_temporario_id == null ));
    }, [allAnimals]);


    const recentAnimals: Animal[] = useMemo(() => {
        if (!allAnimals) return [];
        return allAnimals.slice(0, 5);
    }, [allAnimals]);

    const approvalAnimals: Animal[] = useMemo(() => {
        if (!allAnimals) return [];
        return allAnimals.filter(a => a.situacao === 'em_aprovacao').slice(0, 5);
    }, [allAnimals]);

    type StatusName = {
        [key in Situacao]: string;
    };

    const statusNameMap: StatusName = {
        disponivel: 'Disponível',
        em_aprovacao: 'Em Aprovação',
        em_adocao: 'Em Adoção',
        adotado: 'Adotado',
    };

    const statusPieData = useMemo<PieData[]>(() => {
        if (!allAnimals) return [];

        const counts = allAnimals.reduce((acc: { [x: string]: any; }, animal: { situacao: string; }) => {
            const status = animal.situacao || 'indefinido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Formata para o gráfico
        return Object.entries(counts).map(([name, value]) => ({ name: statusNameMap[name as keyof StatusName] || name, value: value as number }));
    }, [allAnimals]);

    // Gráfico 2: Castrados vs. Não Castrados
    const castrationPieData = useMemo<PieData[]>(() => {
        if (!allAnimals) return [];

        const counts = {
            'Castrados': 0,
            'Não Castrados': 0,
        };

        allAnimals.forEach((animal: { castrado: any; }) => {
            if (animal.castrado) {
                counts['Castrados']++;
            } else {
                counts['Não Castrados']++;
            }
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value: value as number }));
    }, [allAnimals]);


    // --- Renderização ---
    if (isLoading) return <Loading />;
    if (isError) return <Alert severity="error">{(error as Error).message}</Alert>;

    return (
        <Grid container spacing={3}>

            <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                <MetricCard
                    title="Animais"
                    value={allAnimals?.length || 0}
                    description='Todos os animais no período'
                />
            </Grid>

            <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                <MetricCard
                    title="Animais em Aprovação"
                    value={allAnimals?.filter(a => a.situacao === 'em_aprovacao').length || 0}
                    description='Animais em aprovação para adocão'
                />
            </Grid>

            <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                <MetricCard
                    title="Animais em Lares"
                    value={animalsLares?.length || 0}
                    description='Somente animais aprovados para adocão'
                />
            </Grid>

            <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                <MetricCard
                    title="Animais com Adotantes"
                    value={animalsComAdotantes?.length || 0}
                    description='Considera animais já adotados'
                />
            </Grid>

            {/* Linha 1: Os Gráficos */}
            <Grid size={{ xs: 12, md: 6, sm: 6 }}>
                <SimplePieChart
                    data={statusPieData}
                    colors={COLORS_ANIMAIS}
                    title="Status dos Animais"
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6, sm: 6 }}>
                <SimplePieChart
                    data={castrationPieData}
                    colors={COLORS_CASTRADOS}
                    title="Controle de Castração"
                />
            </Grid>

            {/* Linha 2: As Tabelas */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>Animais Recentes</Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Data</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentAnimals.map(animal => (
                                <TableRow key={animal.id} component={Link} to={`/animais/${animal.id}/show`}
                                    sx={{
                                        ":hover": { backgroundColor: '#e3f2fd', cursor: 'pointer' },
                                        textDecoration: 'none'
                                    }}
                                >
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar
                                                src={
                                                    (animal.imagens && animal.imagens.length > 0)
                                                        ? (import.meta.env.VITE_API_URL + '/imagens/' + animal.imagens[0].caminho)
                                                        : undefined
                                                }
                                            />
                                            <p>{animal.nome}</p>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{animal.situacao}</TableCell>
                                    <TableCell>
                                        {format(new Date(animal.created_at), 'dd/MM/yyyy HH:mm')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} align="right">
                                    <Button component={Link}
                                        to={`/animais?filter=${encodeURIComponent(JSON.stringify({ ...filter }))}?sort=created_at`}
                                        variant="outlined"
                                        color="primary"
                                        size='small'
                                    >
                                        Ver Todos ({allAnimals?.length})
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>Animais para Aprovação</Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Data</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {approvalAnimals.length > 0 ? (
                                approvalAnimals.map(animal => (
                                    <TableRow key={animal.id} component={Link} to={`/animais/${animal.id}/show`}
                                        sx={{
                                            ":hover": { backgroundColor: '#e3f2fd', cursor: 'pointer' },
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar
                                                    src={
                                                        (animal.imagens && animal.imagens.length > 0)
                                                            ? (import.meta.env.VITE_API_URL + '/imagens/' + animal.imagens[0].caminho)
                                                            : undefined
                                                    }
                                                />
                                                <p>{animal.nome}</p>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>{animal.situacao}</TableCell>
                                        <TableCell>
                                            {format(new Date(animal.created_at), 'dd/MM/yyyy HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        Nenhum animal para aprovação.
                                    </TableCell>

                                </TableRow>

                            )}
                        </TableBody>
                        {approvalAnimals.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} align="right">
                                        <Button component={Link}
                                            to={`/animais?filter=${encodeURIComponent(JSON.stringify({ ...filter, 'situacao': 'em_aprovacao' }))}?sort=created_at`}
                                            variant="outlined"
                                            color="primary"
                                            size='small'
                                        >
                                            Ver Todos ({allAnimals?.filter(a => a.situacao === 'em_aprovacao').length})
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </TableContainer>
            </Grid>
        </Grid >
    );
};