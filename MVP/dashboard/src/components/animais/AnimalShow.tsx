import {
    Show,
    TabbedShowLayout,
    Tab,
    TextField,
    DateField,
    SelectField,
    useRecordContext,
    ReferenceManyField,
    SimpleList,
    TopToolbar,
    EditButton,
    ListButton,
    Link,
    DeleteWithConfirmButton,
    Loading,
} from "react-admin";
import { Card, CardContent, Typography, Box, Grid, Dialog, DialogContent, IconButton, Button } from "@mui/material";
import { FaEye } from "react-icons/fa";
import { Key, SetStateAction, useState } from "react";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import InboxIcon from '@mui/icons-material/Inbox';

interface ImageDialogProps {
    open: boolean;
    onClose: () => void;
    imageUrl: string;
}


const CastracaoInfo = () => {
    const record = useRecordContext();
    if (!record) return null;

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="body2">
                <strong>Castrado:</strong> {record.castrado ? "Sim" : "Não"}
            </Typography>
            <Typography variant="body2">
                <strong>Vale Castração:</strong> {record.vale_castracao ? "Sim" : "Não"}
            </Typography>
        </Box>
    );
};

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
            {/* --- Adoções Relacionadas --- */}
            <Card sx={{ px: 0 }}>
                <CardContent sx={{ px: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ px: 2 }}>
                            Adoções Relacionadas
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ mr: 2 }}
                            endIcon={<NavigateNextIcon />}
                        >
                            <Link
                                to={`/adocoes?filter=${encodeURIComponent(JSON.stringify({ "animal_id": record.id }))}`}
                                sx={{ textDecoration: 'none', color: 'primary.main' }}
                            >
                                Ver todas
                            </Link>
                        </Button>
                    </Box>
                    <ReferenceManyField
                        reference="adocoes"
                        target="animal_id"
                        sort={{ field: "created_at", order: "DESC" }}
                        perPage={10}
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
                            rightIcon={() => <FaEye size={18} style={{ marginTop: '0.5rem', marginLeft: '2rem', color: '#337ab7' }} />}
                            leftAvatar={(record) =>
                                record.usuario?.imagem
                                    ? import.meta.env.VITE_API_URL + '/imagens/' + record.usuario.imagem
                                    : ''
                            }
                            primaryText={(record) => record.usuario?.nome || "—"}
                            secondaryText={(record) => record.status || ""}
                        />
                    </ReferenceManyField>
                </CardContent>
            </Card>

            <Card sx={{ px: 0 }}>
                <CardContent sx={{ px: 0 }}>
                    <Typography variant="body1" sx={{ px: 2 }}>
                        Afinidades
                    </Typography>

                    <ReferenceManyField
                        reference="match-afinidades"
                        target="animal_id"
                        sort={{ field: "created_at", order: "DESC" }}
                        perPage={5}
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
                            leftAvatar={(record) =>
                                record.usuario?.imagem
                                    ? import.meta.env.VITE_API_URL + '/imagens/' + record.usuario.imagem
                                    : ''
                            }
                            primaryText={(record) => record.usuario?.nome || "—"}
                            secondaryText={(record) => record.status || ""}
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

const Gallery = ({ images }: { images: any[] }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const handleImageClick = (imageUrl: SetStateAction<string>) => {
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
                                height: '100%',
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

const AnimalShowActions = () => (
    <TopToolbar
        sx={{
            backgroundColor: '#fafafb !important',
        }}
    >
        <DeleteWithConfirmButton
            successMessage="Animal excluído"
        />
        <EditButton />
        <ListButton label="Voltar" />
    </TopToolbar>
);

const AnimalShow = () => (
    <Show
        title="Detalhes do Animal"
        actions={<AnimalShowActions />}
        sx={{
            width: { xs: '100%', md: 800 },
            margin: '0 auto',
            '& .RaShow-card': {
                boxShadow: 'none',
            },
        }}
        render={({ record, error, isPending }) => {
            if (isPending) return <Loading />;
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
                                    <Tab label="Informações">
                                        <TextField source="nome" label="Nome" />
                                        <DateField source="data_nascimento" label="Data de Nascimento" />

                                        <SelectField
                                            source="tipo_animal"
                                            label="Tipo"
                                            choices={[
                                                { id: 'gato', name: 'Gato' },
                                                { id: 'cao', name: 'Cachorro' },
                                                { id: 'outro', name: 'Outro' },
                                            ]}
                                        />

                                        <SelectField
                                            source="sexo"
                                            label="Sexo"
                                            choices={[
                                                { id: 'macho', name: 'Macho' },
                                                { id: 'femea', name: 'Fêmea' },
                                            ]}
                                        />

                                        <CastracaoInfo />

                                        <TextField source="descricao" label="Descrição" />
                                    </Tab>

                                    <Tab label="Galeria">
                                        <Gallery images={record?.imagens} />
                                    </Tab>

                                    <Tab label="Perfil">
                                        <SelectField
                                            source="nivel_energia"
                                            label="Nível de Energia"
                                            choices={[
                                                { id: 'baixa', name: 'Calmo / Tranquilo' },
                                                { id: 'moderada', name: 'Ativo / Brincalhão' },
                                                { id: 'alta', name: 'Muito Energético' },
                                            ]}
                                        />

                                        <SelectField
                                            source="tamanho"
                                            label="Tamanho/Porte"
                                            choices={[
                                                { id: 'pequeno', name: 'Pequeno (até 10kg)' },
                                                { id: 'medio', name: 'Médio (10kg a 25kg)' },
                                                { id: 'grande', name: 'Grande (acima de 25kg)' },
                                            ]}
                                        />

                                        <SelectField
                                            source="tempo_necessario"
                                            label="Necessidade de Tempo e Cuidado"
                                            choices={[
                                                { id: 'pouco_tempo', name: 'Pouco tempo (independente)' },
                                                { id: 'tempo_moderado', name: 'Tempo moderado (gosta de companhia)' },
                                                { id: 'muito_tempo', name: 'Muito tempo (precisa de atenção constante)' },
                                            ]}
                                        />

                                        <SelectField
                                            source="ambiente_ideal"
                                            label="Ambiente Ideal"
                                            choices={[
                                                { id: 'area_pequena', name: 'Área pequena (apartamento)' },
                                                { id: 'area_media', name: 'Área média (casa com quintal pequeno)' },
                                                { id: 'area_externa', name: 'Área externa ampla (sítio ou espaço aberto)' },
                                            ]}
                                        />
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
    />
);

export default AnimalShow;