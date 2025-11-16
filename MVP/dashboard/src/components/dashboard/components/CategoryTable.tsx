import * as React from 'react';
import { FC, useState, useMemo } from 'react';
import {
    Card,
    CardContent,
    Typography,
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
import { CategoryDataPoint, Transacao } from '../types';
import { formatCurrency } from '../utils/formatter';

// --- NOVAS PROPS ---
/**
 * As novas props para este componente.
 * Ele só precisa do título e da lista de TODAS as transações.
 */
interface CategoryTableProps {
    title: string;
    transactions: Transacao[]; // <--- Recebe o novo tipo Transacao[]
}

// Tipos locais para ordenação (mantidos)
type Order = 'asc' | 'desc';
type CategoryDataKey = keyof CategoryDataPoint;


// --- Componente de Tabela de Categorias ATUALIZADO ---
const CategoryTable: FC<CategoryTableProps> = ({
    title,
    transactions, // Recebe a lista de transações
}) => {

    // --- LÓGICA DE AGRUPAMENTO (Tudo interno) ---

    /**
     * 1. Filtra apenas as transações concluídas.
     * Esta é a base para todos os cálculos.
     */
    const completedTransactions = useMemo(() => {
        if (!transactions) return [];
        // O 'valor' já é um número, então não precisamos de parseFloat
        return transactions.filter(t => t.situacao === 'concluido');
    }, [transactions]);


    /**
     * 2. Transforma para a Tabela de Categorias (agrupado por categoria)
     * Agora usa a lista filtrada 'completedTransactions'.
     */
    const categoryTableData = useMemo<CategoryDataPoint[]>(() => {
        if (!completedTransactions) return [];

        const groupedByCategory = completedTransactions.reduce((acc, t) => {
            const categoryKey = t.categoria;

            if (!acc[categoryKey]) {
                acc[categoryKey] = { categoria: categoryKey, receitas: 0, despesas: 0, resultado: 0 };
            }

            const valorValido = Number(t.valor) || 0;

            if (t.tipo === 'receita') {
                acc[categoryKey].receitas += valorValido;
            } else if (t.tipo === 'despesa') {
                acc[categoryKey].despesas += valorValido;
            }

            return acc;
        }, {} as Record<string, CategoryDataPoint>);

        return Object.values(groupedByCategory).map(c => ({
            ...c,
            resultado: c.receitas - c.despesas,
        }));

    }, [completedTransactions]);

    /**
     * 3. Contagem de transações por categoria
     * Agora usa a lista filtrada 'completedTransactions'.
     */
    const transactionCounts = useMemo(() => {
        if (!completedTransactions) return {};
        return completedTransactions.reduce((acc, t) => {
            const key = t.categoria;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [completedTransactions]); // Depende das transações filtradas

    /**
     * 4. Total de transações
     * Agora usa a lista filtrada 'completedTransactions'.
     */
    const totalTransactions = useMemo(
        () => completedTransactions.length,
        [completedTransactions] // Depende das transações filtradas
    );

    // --- FIM DA LÓGICA DE AGRUPAMENTO ---


    // --- LÓGICA DE ORDENAÇÃO E TOTAIS ---
    // (Esta parte não muda, pois depende dos dados já agrupados)
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
        if (!Array.isArray(categoryTableData)) return [];
        return [...categoryTableData].sort(getComparator(order, orderBy));
    }, [categoryTableData, order, orderBy]);

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

    // O JSX de renderização não precisa de NENHUMA alteração
    return (
        <Card sx={{ boxShadow: 0, p: 0, backgroundColor: 'transparent' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                    {title}
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                    <MuiTable stickyHeader aria-label="Tabela de categorias">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sortDirection={
                                        orderBy === 'categoria' ? order : false
                                    }
                                >
                                    <TableSortLabel
                                        active={orderBy === 'categoria'}
                                        direction={
                                            orderBy === 'categoria' ? order : 'asc'
                                        }
                                        onClick={() =>
                                            handleRequestSort('categoria')
                                        }
                                    >
                                        Categoria
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sortDirection={
                                        orderBy === 'receitas' ? order : false
                                    }
                                >
                                    <TableSortLabel
                                        active={orderBy === 'receitas'}
                                        direction={
                                            orderBy === 'receitas' ? order : 'asc'
                                        }
                                        onClick={() =>
                                            handleRequestSort('receitas')
                                        }
                                    >
                                        Receitas
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sortDirection={
                                        orderBy === 'despesas' ? order : false
                                    }
                                >
                                    <TableSortLabel
                                        active={orderBy === 'despesas'}
                                        direction={
                                            orderBy === 'despesas' ? order : 'asc'
                                        }
                                        onClick={() =>
                                            handleRequestSort('despesas')
                                        }
                                    >
                                        Despesas
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sortDirection={
                                        orderBy === 'resultado' ? order : false
                                    }
                                >
                                    <TableSortLabel
                                        active={orderBy === 'resultado'}
                                        direction={
                                            orderBy === 'resultado' ? order : 'asc'
                                        }
                                        onClick={() =>
                                            handleRequestSort('resultado')
                                        }
                                    >
                                        Resultado
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel active={false}>
                                        Qtd.
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((row) => (
                                <TableRow key={row.categoria}>
                                    <TableCell component="th" scope="row">
                                        {row.categoria}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{ color: 'success.dark' }}
                                    >
                                        {formatCurrency(row.receitas)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{ color: 'error.dark' }}
                                    >
                                        {formatCurrency(row.despesas)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color:
                                                row.resultado >= 0
                                                    ? 'success.dark'
                                                    : 'error.dark',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {formatCurrency(row.resultado)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {transactionCounts[row.categoria] || 0}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow sx={{ backgroundColor: '#f4f4f4' }}>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    Totais
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ color: 'success.dark', fontWeight: 'bold' }}
                                >
                                    {formatCurrency(totalReceitas)}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ color: 'error.dark', fontWeight: 'bold' }}
                                >
                                    {formatCurrency(totalDespesas)}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        color:
                                            totalResultado >= 0
                                                ? 'success.dark'
                                                : 'error.dark',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {formatCurrency(totalResultado)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {totalTransactions}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </MuiTable>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default CategoryTable;