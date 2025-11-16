import * as React from 'react';
import { FC } from 'react';
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
import { formatCurrency } from '../utils/formatter';
import { SimpleAreaChartProps } from '../types';

// --- Componente de Gráfico de Área ---
const SimpleAreaChart = ({ data, title }: SimpleAreaChartProps) => (
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

export default SimpleAreaChart;