import * as React from 'react';
import { FC, useMemo } from 'react'; 
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { SimplePieChartProps } from '../types';
// Corrigi o caminho relativo assumindo que 'types' está um nível acima

// --- Componente de Gráfico de Pizza ---
const SimplePieChart: FC<SimplePieChartProps> = ({ data, colors, title, height }) => {
    
    // Calcular o valor total para o percentual
    const total = useMemo(() => 
        data.reduce((sum, entry) => sum + entry.value, 0), 
    [data]);

    // Função para formatar a legenda (com percentual)
    const renderLegendWithPercent = (value: string, entry: any) => {
        const itemValue = entry.payload?.value;

        if (!total || total === 0 || !itemValue) {
            return `${value} (0%)`;
        }

        const percent = (itemValue / total) * 100;
        
        return `${value} (${percent.toFixed(0)}%)`;
    };

    return (
        <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                    {title}
                </Typography>
                <Box sx={{ height: height || 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="35%" 
                                cy="50%"
                                labelLine={false}
                                label={false} 
                                outerRadius={100} // Raio mantido
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    value,
                                    name,
                                ]}
                                wrapperStyle={{ zIndex: 1100 }}
                            />
                            {/* 2. LEGENDA ATUALIZADA PARA O LAYOUT LATERAL */}
                            <Legend
                            wrapperStyle={{ fontSize: 20}} 
                                formatter={renderLegendWithPercent}
                                // Alinha a legenda verticalmente no meio
                                verticalAlign="middle" 
                                // Informa que o layout dos itens é vertical
                                layout="vertical" 
                                // Alinha a caixa da legenda à direita
                                align="left" 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SimplePieChart;