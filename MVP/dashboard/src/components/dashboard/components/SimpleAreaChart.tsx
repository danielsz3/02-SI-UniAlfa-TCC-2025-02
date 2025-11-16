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

    // --- LÓGICA DE AGRUPAMENTO (MOVIDA PARA CÁ) ---

    /**
     * 1. Filtra, agrupa por data e ordena as transações.
     * Agora usa a prop 'transactions'.
     */
    const areaChartData = useMemo<TransactionDataPoint[]>(() => {
        if (!transactions) return [];

        // 1. Filtra apenas as transações concluídas.
        const completedTransactions = transactions.filter(
            t => t.situacao === 'concluido'
        );

        const groupedByDate = completedTransactions.reduce((acc, t) => {
            const dateKey = format(parseISO(t.data), 'dd/MM/yyyy');

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

        // 3. Retorna os valores ordenados por data
        return Object.values(groupedByDate).sort((a, b) =>
            a.data.localeCompare(b.data)
        );
    }, [transactions]); // Depende da prop 'transactions'
    
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
                            // 3. Usa a variável 'areaChartData' interna
                            data={areaChartData} 
                            margin={{
                                top: 10,
                                right: 30,
                                left: 50, // Espaço para a formatação BRL
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