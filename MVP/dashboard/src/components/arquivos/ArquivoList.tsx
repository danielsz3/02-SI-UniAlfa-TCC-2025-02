import {
    List,
    TextInput,
    useListContext,
} from 'react-admin';
import { Link } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, Box, CardActions, IconButton } from '@mui/material';
import {
    PictureAsPdf as PdfIcon,
    InsertDriveFileOutlined as DocIcon,
    InsertDriveFile as GenericFileIcon,
    Description as TextIcon, // Ícone para texto, se necessário
    DataObject as DataIcon, // Ícone para dados/planilhas
} from '@mui/icons-material';
import React from 'react';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EditSquareIcon from '@mui/icons-material/EditSquare';

// --- Variáveis de Estilo ---

// Mapeamento de cor e ícone por extensão
const fileTypeStyles = {
    pdf: { icon: PdfIcon, color: 'error.main', bgColor: '#fee8e8' }, // Vermelho claro
    doc: { icon: DocIcon, color: 'primary.main', bgColor: '#e8f0fe' }, // Azul claro
    docx: { icon: DocIcon, color: 'primary.main', bgColor: '#e8f0fe' },
    xls: { icon: DataIcon, color: 'success.main', bgColor: '#e8fef4' }, // Verde claro
    xlsx: { icon: DataIcon, color: 'success.main', bgColor: '#e8fef4' },
    txt: { icon: TextIcon, color: 'text.secondary', bgColor: '#f5f5f5' }, // Cinza claro
    default: { icon: GenericFileIcon, color: 'text.disabled', bgColor: '#eeeeee' }, // Cinza bem claro
};

// --- Funções Auxiliares ---

// Filtros para a busca na lista
const filters = [
    <TextInput label="Título" source="titulo" size="small" alwaysOn />,
];

/**
 * Retorna o ícone e a cor de fundo com base na extensão do arquivo.
 * @param {string | { src: string }} filename - O nome do arquivo (ex: "relatorio.pdf") ou um objeto com a propriedade "src".
 * @returns {{ icon: React.ReactElement, bgColor: string }} - O componente do ícone e a cor de fundo.
 */
const getIconAndBackgroundForFileType = (filename: string | { src: string }): { icon: React.ReactElement, bgColor: string } => {
    const defaultStyle = fileTypeStyles.default;
    let style = defaultStyle;

    const extension = typeof filename === 'string' 
    ? filename.split('.').pop()?.toLowerCase() 
    : filename.src.split('.').pop()?.toLowerCase();

    style = fileTypeStyles[extension as keyof typeof fileTypeStyles] || defaultStyle;

    const IconComponent = style.icon;

    return {
        icon: <IconComponent sx={{ fontSize: 40, color: style.color }} />,
        bgColor: style.bgColor,
    };
};

// Função para converter bytes em formato legível
const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);

    return `${size} ${sizes[i]}`;
};

// --- Componentes Principais ---

// Componente de Card individual para cada arquivo
const ArquivoGrid = () => {
    const { data, isLoading } = useListContext();

    if (isLoading || !data) return null;

    return (
        <Grid
            container
            spacing={3}
            sx={{
                p: 2,
                backgroundColor: (theme) => theme.palette.background.default,
            }}
        >
            {data?.map((record) => {
                const { icon, bgColor } = getIconAndBackgroundForFileType(record?.arquivo);

                return (
                    <Grid key={record.id} size={{ xs: 12, md: 4, sm: 6, lg: 3 }}>
                        <Card
                            raised
                            sx={{
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                textDecoration: 'none',
                                color: 'inherit',
                                pr: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    minWidth: 65,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: bgColor,
                                }}
                            >
                                {icon}
                            </Box>
                            <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="subtitle1" component="div" title={record?.titulo}>
                                    {record?.titulo || 'Sem título'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {record?.categoria || 'Sem categoria'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatFileSize(record?.tamanho)}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{
                                p: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                '& > :not(style) + :not(style)': {
                                    marginLeft: 0,
                                },
                            }}>
                                <IconButton
                                    component={Link}
                                    to={`/documentos/${record.id}`}
                                >
                                    <EditSquareIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    aria-label="download"
                                    to={`${import.meta.env.VITE_API_URL}/documentos/${record.id}/download`}
                                    component={Link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                >
                                    <FileDownloadOutlinedIcon fontSize="small" />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
};

// Componente principal da lista
export const ArquivoList = () => (
    <List
        filters={filters}
        title="Documentos"
        // Estilos para remover a sombra padrão da lista do React-Admin
        sx={{
            '& .RaList-content': {
                boxShadow: 'none',
            },
        }}
    >
        <ArquivoGrid />
    </List>
);