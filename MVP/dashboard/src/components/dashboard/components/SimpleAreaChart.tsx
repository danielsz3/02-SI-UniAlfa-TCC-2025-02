import * as React from 'react';
// 1. Importar useMemo
import { FC, useMemo } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
// 2. Importar o tipo Transacao e formatadores de data
import { Transacao } from '../types';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/formatter';

// --- NOVAS PROPS ---
/**
 * O tipo de dados que o *gráfico* AreaChart espera.
 */
interface TransactionDataPoint {
    data: string;
    entradas: number;
    saidas: number;
}

/**
 * As novas props para este componente.
 * Ele só precisa do título e da lista de TODAS as transações.
 */
interface SimpleAreaChartProps {
    title: string;
    transactions: Transacao[]; // <--- Recebe o novo tipo Transacao[]
}


// --- Componente de Gráfico de Área ATUALIZADO ---
const SimpleAreaChart: FC<SimpleAreaChartProps> = ({
    title,
    transactions
}) => {

    // --- LÓGICA DE AGRUPAMENTO ---
    const areaChartData = useMemo<TransactionDataPoint[]>(() => {
        if (!Array.isArray(transactions)) return [];

        const completedTransactions = transactions.filter(
            t => t.situacao === 'concluido'
        );

        const groupedByDate = completedTransactions.reduce((acc, t) => {
            const dateKey = format(parseISO(t.data), 'dd/MM/yyyy');

            if (!acc[dateKey]) {
                acc[dateKey] = { data: dateKey, entradas: 0, saidas: 0 };
            }

            const valorSeguro = Number(t.valor) || 0;

            if (t.tipo === 'receita') {
                acc[dateKey].entradas += valorSeguro;
            } else if (t.tipo === 'despesa') {
                acc[dateKey].saidas += valorSeguro;
            }

            return acc;
        }, {} as Record<string, TransactionDataPoint>);

        // --- AJUSTE DE ORDENAÇÃO AQUI ---
        return Object.values(groupedByDate).sort((a, b) => {
            const [diaA, mesA, anoA] = a.data.split('/');
            const [diaB, mesB, anoB] = b.data.split('/');

            const dataA = new Date(Number(anoA), Number(mesA) - 1, Number(diaA));
            const dataB = new Date(Number(anoB), Number(mesB) - 1, Number(diaB));

            return dataA.getTime() - dataB.getTime();
        });
    }, [transactions]);

    // --- FIM DA LÓGICA DE AGRUPAMENTO ---


    // O JSX de renderização não muda, apenas a prop 'data'
    return (
        <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                    {title}
                </Typography>
                <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={areaChartData}
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
                                stroke="#4CAF50" // Cor definida diretamente
                                fill="#4CAF50"
                                fillOpacity={0.6}
                                name="Entradas"
                            />
                            <Area
                                type="monotone"
                                dataKey="saidas"
                                stroke="#F44336" // Cor definida diretamente
                                fill="#F44336"
                                fillOpacity={0.6}
                                name="Saídas"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SimpleAreaChart;