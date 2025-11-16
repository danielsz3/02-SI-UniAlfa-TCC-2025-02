import * as React from 'react';
import { FC } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { MetricCardProps } from '../types';

// O resto do componente é IDÊNTICO ao que você tinha
export const MetricCard = ({ title, value, description }: MetricCardProps) => (
    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent sx={{ pb: 0, p: 2 }}>
            <Typography
                variant="h4"
                component="div"
                fontWeight="bold"
                color="primary"
            >
                {value}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            )}
        </CardContent>
    </Card>
);

export default MetricCard;