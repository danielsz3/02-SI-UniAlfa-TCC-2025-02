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
import { LarTemp, PieData } from '../types';
import { useApiSearch } from '../hooks/useApiSearch';
import { Situacao } from 'src/components/animais/AnimalList';
import { red } from '@mui/material/colors';
import MetricCard from './MetricCard';

interface LaresTabProps {
    startDate: Date | null;
    endDate: Date | null;
}

function calculateAge(data_nascimento: any): number {
    if (!data_nascimento) return 0;

    const birthDate = new Date(data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Verifica se o aniversário deste ano já passou
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// --- Constantes de Cor ---
const COLORS_LAR = ['#0088FE', '#00C49F', '#f0b12a', '#FF8042', '#8884d8'];

// --- Componente da Aba ---
export const LaresTab = ({ startDate, endDate }: LaresTabProps) => {

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
        data: allLares,
        isLoading,
        isError,
        error
    } = useApiSearch<LarTemp>(
        'lares-temporarios', // Seu endpoint de lista de animais
        pagination,
        sort,
        filter
    );


    const recentLares: LarTemp[] = useMemo(() => {
        if (!allLares) return [];
        return allLares.slice(0, 5);
    }, [allLares]);

    const idadeMedia: number = useMemo(() => {
        if (!allLares) return 0;

        const ativos = allLares.filter(lar => lar.situacao === 'ativo');
        const idades = ativos.map(lar => calculateAge(lar.data_nascimento));
        const soma = idades.reduce((acc, curr) => acc + curr, 0);
        const media = soma / idades.length;
        return media;
    }, [allLares]);

    const topLares: LarTemp[] = useMemo(() => {
        if (!allLares) return [];

        const sortedLares = [...allLares]
            .sort((a, b) =>
                b.animais.filter(animal => animal.situacao !== 'adotado').length -
                a.animais.filter(animal => animal.situacao !== 'adotado').length);

        return sortedLares.slice(0, 5);
    }, [allLares]);

    const situacaoPieData = useMemo<PieData[]>(() => {
        if (!allLares) return [];

        const counts = {
            'Ativos': 0,
            'Inativos': 0,
        };

        allLares.forEach((lar: { situacao: any; }) => {
            if (lar.situacao === 'inativo') {
                counts['Inativos']++;
            } else {
                counts['Ativos']++;
            }
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value: value as number }));
    }, [allLares]);


    // --- Renderização ---
    if (isLoading) return <Loading />;
    if (isError) return <Alert severity="error">{(error as Error).message}</Alert>;

    return (
        <Grid container spacing={3}>

            <Grid size={{ xs: 12, sm: 4 }}>
                <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
                    <MetricCard
                        title="Lares Temporários"
                        value={allLares?.length || 0}
                        description='Todos os lares no período'
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <MetricCard
                        title="Faixa de idade dos Responsáveis"
                        value={idadeMedia || 0}
                        description='Em anos, considerando somente ativos'
                    />
                </Grid>
            </Grid>

            <Grid size={{ xs: 12, sm: 8 }}>
                <SimplePieChart
                    height={200}
                    data={situacaoPieData}
                    colors={COLORS_LAR}
                    title="Status dos Lares"
                />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>Lares Recentes</Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Responsável</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Data</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentLares.map(lar => (
                                <TableRow key={lar.id} component={Link} to={`/lares-temporarios/${lar.id}/show`}
                                    sx={{
                                        ":hover": { backgroundColor: '#e3f2fd', cursor: 'pointer' },
                                        textDecoration: 'none'
                                    }}
                                >
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar
                                                src={
                                                    (lar.imagens && lar.imagens.length > 0)
                                                        ? (import.meta.env.VITE_API_URL + '/imagens/' + lar.imagens[0].caminho)
                                                        : undefined
                                                }
                                            />
                                            <p>{lar.nome}</p>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{lar.situacao}</TableCell>
                                    <TableCell>
                                        {format(new Date(lar.created_at), 'dd/MM/yyyy HH:mm')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} align="right">
                                    <Button component={Link}
                                        to={`/lares-temporarios?filter=${encodeURIComponent(JSON.stringify({ ...filter }))}?sort=created_at`}
                                        variant="outlined"
                                        color="primary"
                                        size='small'
                                    >
                                        Ver Todos ({allLares?.length})
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>Lares com mais Animais</Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Responsável</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Animais</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {topLares.length > 0 &&
                                topLares.map(lar => (
                                    <TableRow key={lar.id} component={Link} to={`/lares-temporarios/${lar.id}/show`}
                                        sx={{
                                            ":hover": { backgroundColor: '#e3f2fd', cursor: 'pointer' },
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar
                                                    src={
                                                        (lar.imagens && lar.imagens.length > 0)
                                                            ? (import.meta.env.VITE_API_URL + '/imagens/' + lar.imagens[0].caminho)
                                                            : undefined
                                                    }
                                                />
                                                <p>{lar.nome}</p>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>{lar.situacao}</TableCell>
                                        <TableCell>
                                            {lar.animais.filter(animal => animal.situacao !== 'adotado').length}
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                        {topLares.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} align="right">
                                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
                                        <Typography variant="subtitle2" sx={{mb:1}}>Desconsidera animais já adotados</Typography>
                                        
                                        </Box>
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


