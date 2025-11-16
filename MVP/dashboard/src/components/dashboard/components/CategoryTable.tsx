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
import { CategoryDataPoint, CategoryTableProps } from '../types';
import { formatCurrency } from '../utils/formatter';

// Tipos locais para ordenação (definidos aqui como no original)
type Order = 'asc' | 'desc';
type CategoryDataKey = keyof CategoryDataPoint;

// --- Componente de Tabela de Categorias (COM CORREÇÕES) ---
const CategoryTable = ({
    data,
    title,
    transactionCounts,
    totalTransactions,
}: CategoryTableProps) => {
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