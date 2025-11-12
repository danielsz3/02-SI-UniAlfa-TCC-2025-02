import {
    Show,
    TabbedShowLayout,
    Tab,
    TextField,
    DateField,
    ImageField,
    useRecordContext,
    ReferenceManyField,
    SelectField,
    SimpleList,
} from "react-admin";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { FaEye } from "react-icons/fa";

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
                width: { xs: '100%' },
                maxWidth: { xs: '100%', md: 300 },
            }}
        >
            {/* --- Adoções Relacionadas --- */}
            <Card sx={{ px: 0 }}>
                <CardContent sx={{ px: 0 }}>
                    <Typography variant="body1" sx={{ px: 2 }}>
                        Adoções Relacionadas
                    </Typography>

                    <ReferenceManyField
                        reference="adocoes"
                        target="animal_id"
                        sort={{ field: "created_at", order: "DESC" }}
                        perPage={5}
                    >
                        <SimpleList
                            rightIcon={(record) => <FaEye size={18} key={record} />}
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

const AnimalShow = () => (
    <Show
        title="Detalhes do Animal"
        sx={{
            maxWidth: 700, margin: '0 auto',
            '& .RaShow-card': {
                boxShadow: 'none',
            },
        }}
        render={({ record, error, isPending }) => {
            if (isPending) return <p>Loading...</p>;
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
                                        <TextField source="id" label="ID" />
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
                                        <ImageField
                                            source="imagens"
                                            label="Imagens do Animal"
                                            src="src"
                                            title="title"
                                            sx={{
                                                '& img': {
                                                    width: 150,
                                                    height: 150,
                                                    objectFit: 'cover',
                                                    borderRadius: 4,
                                                    marginRight: 1,
                                                },
                                            }}
                                        />
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
