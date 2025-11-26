import { deepmerge } from '@mui/utils';
import { createTheme } from '@mui/material/styles';
import { type TranslationMessages, defaultTheme } from 'react-admin';

// --- Imports de Tradução ---
import ptBrMessages from 'ra-language-pt-br';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import { ptBR as corePtBR } from '@mui/material/locale';       // <-- ADICIONADO
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales'; // <-- ADICIONADO

// --- Configuração de Idioma (i18n) ---
const messages: { [key: string]: TranslationMessages } = {
    'pt-br': ptBrMessages,
};

export const i18nProvider = polyglotI18nProvider(locale => messages[locale], 'pt-br');


// --- Configuração do Tema ---
const baseTheme = deepmerge(defaultTheme, {

    components: {
        MuiTextField: {
            defaultProps: {
                variant: 'outlined' as const,
            },
        },
        RaLayout: {
            styleOverrides: {
                root: {
                    width: '98vw',
                }
            }
        },
        RaMenuItemLink: {
            styleOverrides: {
                root: {
                    borderLeft: '3px solid #fff',
                    '&.RaMenuItemLink-active': {
                        borderLeft: '5px solid #337ab7',
                    },
                    '&:hover': {
                        color: '#337ab7',
                        fontWeight: 500
                    }
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        color: '#337ab7',
                        backgroundColor: '#f0f0f0',
                    },
                    '&.Mui-selected:hover': {
                        color: '#23527c',
                    }
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                colorSecondary: {
                    color: '#fff',
                    backgroundColor: '#337ab7',
                },
            },
            defaultProps: {
                elevation: 2,
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    backgroundColor: '#f5f5f5',
                },
                bar: {
                    backgroundColor: '#337ab7',
                }
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:last-child td': { border: 0 },
                },
            },
        },
    },
    palette: {
        primary: {
            main: '#337ab7',
        },
        secondary: {
            main: '#23527c',
            color: '#fff',
        },
        error: { main: '#c7483fff' },
        contrastThreshold: 3,
        tonalOffset: 0.2,
    },
});

export const myTheme = createTheme(baseTheme, pickersPtBR, corePtBR);
