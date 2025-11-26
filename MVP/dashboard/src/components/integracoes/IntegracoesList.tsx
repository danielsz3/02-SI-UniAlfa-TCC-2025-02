import {
    List,
    TextInput,
    useListContext,
} from 'react-admin';
import { Link } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';
import React from 'react';
import { FaWhatsapp, FaInstagram } from "react-icons/fa";

// Filtros
const filters = [
    <TextInput label="Serviço" source="service" size="small" alwaysOn />,
];

// Configurações dos serviços
const serviceConfig: Record<string, { color: string, icon: JSX.Element, description: string }> = {
    whatsapp: {
        color: "#25D366",
        icon: <FaWhatsapp size={28} color="#25D366" />,
        description: "Integre o WhatsApp ao seu sistema"
    },
    instagram: {
        color: "#E1306C",
        icon: <FaInstagram size={28} color="#E1306C" />,
        description: "Gerencie postagens com o Instagram"
    },
};

const IntegracoesGrid = () => {
    const { data, isLoading } = useListContext();

    if (isLoading || !data) return null;

    return (
        <Grid
            container
            spacing={2}
            sx={{
                p: 2,
                backgroundColor: theme => theme.palette.background.default,
            }}
        >
            {data?.map(record => {
                const config = serviceConfig[record?.service?.toLowerCase()] || {
                    color: "#9e9e9e",
                    icon: null,
                    description: "Integração disponível"
                };

                const isActive = record?.status === "ativo";
                const isConnected = Boolean(record?.username);

                return (
                    <Grid key={record.id} size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                        <Card
                            variant='elevation'
                            sx={{
                                borderRadius: 2,
                                p: 2,
                                display: "flex",
                                flexDirection: "column",
                                gap: 1.5,
                                height: "100%",
                                opacity: isActive ? 1 : 0.6,
                            }}
                        >
                            {/* Topo: ícone + status */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: `${config.color}20`, // cor com transparência
                                    }}
                                >
                                    {config.icon}
                                </Box>

                                {isActive && (
                                    <Chip
                                        label={isConnected ? "Conectado" : "Desconectado"}
                                        size="small"
                                        color={isConnected ? "success" : "default"}
                                        variant="outlined"
                                    />
                                )}
                            </Box>

                            {/* Conteúdo */}
                            <CardContent sx={{ p: 0 }}>
                                <Typography variant="h6">
                                    {record?.service
                                        ? record.service.charAt(0).toUpperCase() + record.service.slice(1).toLowerCase()
                                        : "Sem título"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {config.description}
                                </Typography>
                            </CardContent>

                            {/* Botões ou mensagem de indisponível */}
                            {isActive ? (
                                <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        component={Link}
                                        to={`/integracoes/${record.id}`}
                                    >
                                        {isConnected ? "Configurar" : "Conectar"}
                                    </Button>
                                </Box>
                            ) : (
                                <Typography
                                    variant="body1"
                                    sx={{ mt: "auto", fontWeight: "bold", color: "warning.main" }}
                                >
                                    🚧 Disponível em breve
                                </Typography>
                            )}
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
};

// Lista principal
export const IntegracaoList = () => (
    <List filters={filters} title="Integrações"
    
        exporter={false}
        sx={{
            "& .RaList-content": {
                boxShadow: "none",
            },
            "& [class*='RaTopToolbar-root']": {
                display: 'none',
            },
        }}
    >
        <IntegracoesGrid />
    </List>
);
