import { Box, Button, Card, CardContent, Dialog, DialogContent, Grid, IconButton, Theme, Typography } from '@mui/material';
import {
    Show,
    TabbedShowLayout,
    Tab,
    TextField,
    SelectField, // Usado para exibir o valor de um 'choice'
    DateField,
    ImageField,
    ArrayField,
    SingleFieldList,
    ShowProps,
    TopToolbar,
    EditButton,
    ListButton,
    useRecordContext,
    ReferenceManyField,
    SimpleList,
    FunctionField,
    Link,
    useReference,
    Loading
} from 'react-admin';
import { FaEye } from 'react-icons/fa';
import { chipTipos, Situacao, tamanhos } from '../animais/AnimalList';
import { formatarDiferencaData } from "../../utils/formatDate";
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import InboxIcon from '@mui/icons-material/Inbox';

interface ImageDialogProps {
    open: boolean;
    onClose: () => void;
    imageUrl: string;
}

/**
 * Define as ações que aparecem no topo da página de visualização.
 * Inclui um botão para "Editar" e um para "Voltar" (que leva à lista).
 */
const LarTempShowActions = () => (
    <TopToolbar
        sx={{
            backgroundColor: '#fafafb !important',
        }}
    >
        <EditButton />
        <ListButton label="Voltar" />
    </TopToolbar>
);

const Aside = () => {
    const record = useRecordContext();
    if (!record) return null;

    return (
        <Box
            display="flex"
            flexDirection="column"
            gap={2}
            sx={{
                width: { xs: '100%', md: 370 },
            }}
        >
            <Card sx={{ px: 0 }}>
                <CardContent sx={{ px: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ px: 2 }}>
                            Animais neste Lar
                        </Typography>
                        
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ mr: 2 }}
                                endIcon={<NavigateNextIcon />}
                            >
                                <Link
                                    to={`/animais?filter=${encodeURIComponent(JSON.stringify({ "lar_temporario_id": record.id }))}`}
                                    sx={{ textDecoration: 'none', color: 'primary.main' }}
                                >
                                    Ver todos
                                </Link>
                            </Button>
                    </Box>

                    <ReferenceManyField
                        reference="animais"
                        target="lar_temporario_id"
                        filter={{ situacao: ["disponivel", "em_adocao", "em_aprovacao"] }}
                        sort={{ field: "created_at", order: "DESC" }}
                        perPage={100}
                    >
                        <SimpleList
                            empty={
                                <Box textAlign="center" m={4}>
                                    <InboxIcon fontSize="large" color="disabled" />
                                    <Typography variant="h6">
                                        Nenhum item aqui ainda.
                                    </Typography>
                                </Box>
                            }
                            rightIcon={() => <FaEye size={18} style={{ marginTop: '2rem', marginLeft: '2rem', color: '#337ab7' }} />}
                            leftAvatar={(record) =>
                                record.imagens.caminho ||
                                import.meta.env.VITE_API_URL + '/imagens/' + record.imagens[0]?.caminho
                            }
                            primaryText={(record) =>
                                record.nome + ' - ' + tamanhos.find((tamanho) => tamanho.id === record.tamanho)?.name
                            }

                            tertiaryText={(record) => chipTipos[record.situacao as Situacao]?.label ?? 'Indefinido'}
                            secondaryText={(record) => `${formatarDiferencaData(record.data_nascimento)}`}
                        />
                    </ReferenceManyField>
                </CardContent>
            </Card>
        </Box>
    );
};

const ImageDialog = ({ open, onClose, imageUrl }: ImageDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent sx={{ position: 'relative', p: 0 }}>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.primary.contrastText,
                        backgroundColor: 'primary.main',
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <img src={imageUrl} alt="Visualização da Imagem" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </DialogContent>
        </Dialog>
    );
};

const Gallery = ({ images }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedImage('');
    };

    return (
        <>
            <Grid container spacing={1} sx={{ width: "100%" }}>
                {images?.map((img) => (
                    <Grid size={{ xs: 6, sm: 6 }} key={img.id}>
                        <img
                            src={img.src}
                            alt={img.title}
                            style={{
                                width: '100%',
                                height: '170px',
                                objectFit: 'cover',
                                borderRadius: 4,
                                cursor: 'pointer',
                            }}
                            onClick={() => handleImageClick(img.src)}
                        />
                    </Grid>
                ))}
            </Grid>
            <ImageDialog open={openDialog} onClose={handleCloseDialog} imageUrl={selectedImage} />
        </>
    );
};

/**
 * Componente de Visualização para o Lar Temporário.
 */
const LarTempShow = (props: ShowProps) => {

    // As mesmas escolhas usadas no 'Create' para 'situacao'
    const situacaoChoices = [
        { id: 'ativo', name: 'Ativo' },
        { id: 'inativo', name: 'Inativo' }
    ];

    return (
        <Show
            {...props}
            title="Detalhes do Lar Temporário"
            actions={<LarTempShowActions />}
            sx={{
                width: { xs: '100%', md: 800 },
                margin: '0 auto',
                '& .RaShow-card': {
                    boxShadow: 'none',
                },
            }}
            render={({ record, error, isPending }) => {
                if (isPending) return <Loading/>;
                if (error) return <p>Error: {error.message}</p>;
                if (!record) return <p>No record found</p>;

                return (
                    <Box
                        display="flex"
                        flexDirection={{ xs: 'column', md: 'row' }}
                        alignItems="flex-start"
                        gap={2}
                        sx={{
                            width: '100%',
                            margin: '0 auto',
                            p: { xs: 1, sm: 2 },
                            backgroundColor: '#fafafb',

                        }}

                    >
                        {/* Conteúdo principal */}
                        <Box flex="1" width="100%">
                            <Card>
                                <CardContent sx={{ px: 0, py: 0 }}>
                                    <TabbedShowLayout>

                                        <Tab label="Responsável">
                                            <SelectField
                                                label="Situação"
                                                source="situacao"
                                                choices={situacaoChoices}
                                            />

                                            <TextField
                                                source="nome"
                                                label="Nome Completo"
                                            />

                                            <TextField
                                                source="telefone"
                                                label="Telefone"
                                            />

                                            <DateField
                                                source="data_nascimento"
                                                label="Data de Nascimento"
                                                locales="pt-BR"
                                            />

                                            <TextField
                                                source="Experiência"
                                                label="Experiência com animais (opcional)"
                                            />

                                            <FunctionField
                                                label="Endereço"
                                                render={(record) => {
                                                    const parts = [
                                                        record.endereco?.logradouro,
                                                        record.endereco?.numero,
                                                        record.endereco?.bairro,
                                                        record.endereco?.cidade,
                                                        record.endereco?.uf,
                                                        record.endereco?.cep
                                                    ];

                                                    const cep = parts.pop();
                                                    if (cep) {
                                                        parts.push(`CEP: ${cep}`);
                                                    }

                                                    const address = parts.filter(part => !!part).join(', ');
                                                    return address || 'N/A';
                                                }}
                                            />
                                        </Tab>

                                        <Tab label="Galeria">
                                            <Gallery images={record?.imagens} />
                                        </Tab>

                                    </TabbedShowLayout>
                                </CardContent>
                            </Card>
                        </Box>

                        {/* Aside responsivo */}
                        <Aside />
                    </Box>
                );
            }}
        >

        </Show>
    );
};

export default LarTempShow;