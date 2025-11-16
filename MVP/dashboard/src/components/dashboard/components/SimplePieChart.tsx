import * as React from 'react';
// 1. Importar o 'useMemo'
import { FC, useMemo } from 'react'; 
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    // PieLabelRenderProps, // Não é mais necessário
} from 'recharts';
import { SimplePieChartProps } from '../types';

// --- Componente de Gráfico de Pizza ---
const SimplePieChart = ({ data, colors, title }: SimplePieChartProps) => {
    
    // 2. Calcular o valor total para o percentual
    const total = useMemo(() => 
        data.reduce((sum, entry) => sum + entry.value, 0), 
    [data]);

    // 3. Função para formatar a legenda (NOVO)
    /**
     * Adiciona o percentual (ex: "Adotados (45%)") a cada item da legenda.
     */
    const renderLegendWithPercent = (value: string, entry: any) => {
        // 'entry.payload' contém o { name, value } do item
        const itemValue = entry.payload?.value;

        // Evita divisão por zero
        if (!total || total === 0 || !itemValue) {
            return `${value} (0%)`;
        }

        const percent = (itemValue / total) * 100;
        
        // 'value' é o 'name' (ex: "Adotados")
        return `${value} (${percent.toFixed(0)}%)`;
    };

    return (
        <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                    {title}
                </Typography>
                <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                // 4. Rótulo da fatia desativado
                                // (A legenda agora tem o percentual)
                                labelLine={false}
                                label={false} 
                                outerRadius={100}
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
                            {/* 5. Legenda atualizada com o formatador --- */}
                            <Legend formatter={renderLegendWithPercent} />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SimplePieChart;