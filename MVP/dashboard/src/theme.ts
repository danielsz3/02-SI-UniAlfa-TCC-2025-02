import { deepmerge } from '@mui/utils';
import { createTheme } from '@mui/material/styles';
import { type TranslationMessages, defaultTheme } from 'react-admin';

// --- Imports de Tradução ---
import ptBrMessages from 'ra-language-pt-br';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import { ptBR as corePtBR } from '@mui/material/locale';
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales';

// --- Configuração de Idioma (i18n) ---
const messages: { [key: string]: TranslationMessages } = {
    'pt-br': ptBrMessages,
};

export const i18nProvider = polyglotI18nProvider(
    locale => messages[locale],
    'pt-br',
    { allowMissing: true, warn: () => { } }
);

// --- Definição da Paleta (Baseada nas tuas Variáveis CSS) ---
const colors = {
    primary: '#0367A6',         // --primary
    primaryHover: '#025A90',    // --primary-hover
    secondary: '#049DBF',       // --secondary
    secondaryHover: '#038EAD',  // --secondary-hover
    background: '#F2F1F0',      // --background
    paper: '#ffffff',           // --card
    text: '#000000',            // --foreground
    error: '#E63946',           // --destructive
    border: '#d9d9d9',          // --border
    sidebar: '#F2F1F0',         // --sidebar
};

// --- Configuração do Tema ---
const baseTheme = deepmerge(defaultTheme, {
    palette: {
        primary: {
            main: colors.primary,
            dark: colors.primaryHover,
            contrastText: '#ffffff', // --primary-foreground
        },
        secondary: {
            main: colors.secondary,
            dark: colors.secondaryHover,
            contrastText: '#ffffff', // --secondary-foreground
        },
        error: {
            main: colors.error,
        },
        background: {
            default: colors.background,
            paper: colors.paper,
        },
        text: {
            primary: colors.text,
        },
        // Ajustes de contraste automático do MUI
        contrastThreshold: 3,
        tonalOffset: 0.2,
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                // Scrollbars personalizadas com a nova paleta
                '*::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                },
                '*::-webkit-scrollbar-track': {
                    background: colors.background,
                    borderRadius: '4px',
                },
                '*::-webkit-scrollbar-thumb': {
                    background: colors.primary, // Atualizado para Primary
                    borderRadius: '4px',
                    border: `2px solid ${colors.background}`,
                },
                '*::-webkit-scrollbar-thumb:hover': {
                    background: colors.primaryHover, // Atualizado para Primary Hover
                },

                '*': {
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${colors.primary} ${colors.background}`,
                },

                body: {
                    backgroundColor: colors.background,
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${colors.primary} ${colors.background}`,
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: colors.background,
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: colors.primary,
                        borderRadius: '4px',
                        border: `2px solid ${colors.background}`,
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: colors.primaryHover,
                    },
                }
            },
        },

        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },
        RaLayout: {
            styleOverrides: {
                root: {
                    width: '98vw', // Geralmente 100% ou 100vw é melhor que 98vw para evitar scroll horizontal
                    backgroundColor: colors.background,
                    '& .RaLayout-content': {
                        backgroundColor: colors.background,
                    }
                }
            }
        },
        // Estilo do Menu Lateral (Sidebar Links)
        RaMenuItemLink: {
            styleOverrides: {
                root: {
                    borderLeft: '3px solid transparent',
                    color: colors.text,

                    // Ícone Normal
                    '& .RaMenuItemLink-icon': {
                        color: colors.text,
                    },

                    // Estado Ativo (Selecionado)
                    '&.RaMenuItemLink-active': {
                        borderLeft: `5px solid ${colors.primary}`,
                        color: colors.primary,
                        backgroundColor: 'rgba(3, 103, 166, 0.08)',

                        // Ícone Ativo
                        '& .RaMenuItemLink-icon': {
                            color: colors.primary,
                        }
                    },

                    // Estado Hover (Passar o mouse)
                    '&:hover': {
                        color: colors.primary,
                        fontWeight: 500,
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',

                        // Ícone Hover
                        '& .RaMenuItemLink-icon': {
                            color: colors.primary,
                        }
                    }
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        color: colors.primary,
                        backgroundColor: colors.background,
                    },
                    '&.Mui-selected': {
                        color: colors.primary,
                    },
                    '&.Mui-selected:hover': {
                        color: colors.primaryHover,
                    }
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                colorSecondary: {
                    color: '#ffffff',
                    backgroundColor: colors.primary, // Atualizado para Primary
                },
            },
            defaultProps: {
                elevation: 1, // Reduzi levemente a elevação para combinar com o design mais "flat" moderno
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.background,
                },
                bar: {
                    backgroundColor: colors.primary,
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
        // Adicional: Estilização dos Cards para bater com a variável --card
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove gradientes padrão do modo dark se ativado acidentalmente
                },
            }
        }
    },
});

export const myTheme = createTheme(baseTheme, pickersPtBR, corePtBR);