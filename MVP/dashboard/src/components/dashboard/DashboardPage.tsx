import * as React from 'react';
import { useState, FC } from 'react';
import { Title } from 'react-admin';
import { Box, Grid, Tabs, Tab, Button, Typography, useMediaQuery } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importa o formatador

// Importa os novos componentes de aba
import { formatDate } from './utils/formatter';
import { AnimaisTab } from './components/AnimaisTab';
import { LaresTab } from './components/LaresTab';
import { AdocoesTab } from './components/AdocoesTab';

export const Dashboard = () => {
    // --- ESTADOS ---
    const [startDate, setStartDate] = useState<Date | null>(
        subDays(new Date(), 30)
    );

    const isSmall = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));
    const [endDate, setEndDate] = useState<Date | null>(new Date());

    const [tab, setTab] = useState(0);

    // Formata as datas que serão passadas como props
    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    // --- HANDLERS ---
    const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handlePrint = () => {


        // ... (Lógica de impressão idêntica)
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .MuiDrawer-root,
                .no-print {
                    display: none !important;
                }
                /* ... outros estilos de impressão ... */
            }
        `;

        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    // Ajuste o tamanho da página para A3
    const printStyle = document.createElement('style');
    printStyle.innerHTML = `
        @media print {
            html, body {
                width: 297mm;
                height: 420mm;
            }
        }
    `;

    document.head.appendChild(printStyle);

    // --- Renderização ---
    return (
        <Box m={{ xs: 1, sm: 2 }} mt={2} className="print-content">
            <Title title="Dashboard" />

            {/* Seção de Filtros de Data (agora com classe no-print) */}
            <Box>
                <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={ptBR}
                >
                    <Grid container spacing={2} mb={1} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="Data de Início"
                                value={startDate}
                                onChange={(newValue: Date | null) =>
                                    setStartDate(newValue)
                                }
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'outlined',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="Data de Fim"
                                value={endDate}
                                onChange={(newValue: Date | null) =>
                                    setEndDate(newValue)
                                }
                                minDate={startDate || undefined}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'outlined',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="body1" color="text.secondary" className="no-print">
                                Exibindo dados de {formattedStart} até {formattedEnd}.
                            </Typography>
                        </Grid>
                    </Grid>
                </LocalizationProvider>
            </Box>

            {/* NOVA SEÇÃO DE ABAS E BOTÃO DE IMPRIMIR */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 3,
                }}
            >
                <Tabs value={tab} onChange={handleChangeTab} aria-label="Abas do Dashboard">
                    <Tab label="Animais" id="tab-animais" />
                    <Tab label="Lares" id="tab-lares" />
                    <Tab label="Adoções" id="tab-adocoes" />
                    <Tab label="Transações" id="tab-transacoes" />
                </Tabs>

                <Button
                    variant="outlined"
                    startIcon={isSmall ? undefined : <PrintIcon />}
                    className='no-print'
                    onClick={handlePrint}
                    sx={{ mb: 1, ml: 2 }}
                >
                    {isSmall ? <PrintIcon /> : 'Imprimir'}
                </Button>
            </Box>

            {/* Conteúdo das Abas */}
            {/* Renderização condicional: O componente da aba só é montado 
              (e, portanto, só busca dados) quando ele está ativo.
            */}
            <Box>
                {tab === 0 && (
                    <AnimaisTab
                        startDate={startDate}
                        endDate={endDate}
                    />
                )}

                {tab === 1 && (
                    <LaresTab
                        startDate={startDate}
                        endDate={endDate}
                    />
                )}

                {tab === 2 && (
                    <AdocoesTab
                        startDate={startDate}
                        endDate={endDate}
                    />
                )}
                {/*
                {tab === 3 && (
                     <TransacoesTab 
                        startDate={formattedStart} 
                        endDate={formattedEnd} 
                    />
                )} */}
            </Box>
        </Box>
    );
};

export default Dashboard;