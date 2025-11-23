import { useState } from 'react';
import {
    Button,
    Create,
    ImageField,
    ImageInput,
    SaveButton,
    SimpleForm,
    TextInput,
    required,
    useNotify,
    useRedirect,
} from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';
import CustomDatePicker from '../datepicker/customDatePicker';
import { Dialog, DialogTitle, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CustomToolbar } from '../CustomToolbar';
import { useFormContext } from 'react-hook-form';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { ImageData } from '../posts/types';
import { urlToFile } from '../../utils/ImgDownloader';

interface Evento {
    id: number;
    titulo: string;
    descricao: string;
    data_inicio: string;
    data_fim: string;
    local: string;
    imagem: ImageData;
    imagens: ImageData[];
}

/**
 * Validador para a DATA DE INÍCIO.
 * Verifica se a data de início é anterior à data de fim.
 */
const validateDataInicio = (value: string | number | Date, allValues: { data_fim: string | number | Date; }) => {
    const dataInicio = new Date(value);

    if (dataInicio < new Date()) {
        return 'A data de início deve ser futura';
    }

    if (value && allValues.data_fim) {
        const dataFim = new Date(allValues.data_fim);

        if (dataInicio >= dataFim) {
            return 'A data de início deve ser anterior à data de encerramento';
        }
    }
    return undefined;
};

/**
 * Validador para a DATA DE FIM.
 * Verifica se a data de fim é posterior à data de início.
 */
const validateDataFim = (value: string | number | Date, allValues: { data_inicio: string | number | Date; }) => {
    if (value && allValues.data_inicio) {
        const dataInicio = new Date(allValues.data_inicio);
        const dataFim = new Date(value);

        if (dataFim <= dataInicio) {
            return 'A data de encerramento deve ser posterior à data de início';
        }
    }
    return undefined;
};

const EventoToolbar = () => {
    const redirect = useRedirect();
    const notify = useNotify();
    const form = useFormContext();

    const handleBack = () => redirect('list', 'eventos');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
                />,
                <SaveButton
                    type='button'
                    sx={{ fontSize: "0.8rem" }}
                    label='Salvar e Novo'
                    variant='outlined'
                    mutationOptions={{
                        onSuccess: () => {
                            notify('Evento salvo com sucesso! Pronto para criar outro', { type: 'info' });
                            redirect('create', 'eventos');
                            form.reset();
                        },
                    }}
                />,
            ]}
            rightButtons={[
                <Button
                    label="Voltar"
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={handleBack}
                />
            ]}
        />
    );
};

const EventoCreate = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [eventoCriado, setEventoCriado] = useState<Evento | null>(null);
    const navigate = useNavigate();
    const [isNavigating, setIsNavigating] = useState(false);
    const notify = useNotify();


    const handleSuccess = (data: Evento) => {
        setEventoCriado(data);
        setShowDialog(true);
        notify('Evento criado com sucesso!');
    };

    const handleConfirmPost = async () => {
        if (!eventoCriado || isNavigating) return;

        setIsNavigating(true);

        const createImagePromise = async (imgData: any) => {
            const path = imgData.caminho || imgData;
            if (!path) return null;

            const url = `${import.meta.env.VITE_API_URL}/imagens/${path}`;
            const title = imgData.title || path;

            const file = await urlToFile(url, title);

            if (file) {
                return {
                    file: file,
                    title: title,
                };
            }
            return null;
        };

        const promises: Promise<unknown>[] = [];

        if (eventoCriado.imagem) {
            promises.push(createImagePromise(eventoCriado.imagem));
        }

        if (eventoCriado.imagens) {
            eventoCriado.imagens.forEach(img => {
                promises.push(createImagePromise(img));
            });
        }

        const resolvedImages = await Promise.all(promises);

        const validImages = resolvedImages.filter(img => !!img);

        setShowDialog(false);
        navigate('/posts/create', {
            state: {
                defaultValues: {
                    legenda: `Participe do evento "${eventoCriado.titulo}"!\n📅 ${new Date(eventoCriado.data_inicio).toLocaleDateString('pt-BR')} - ${new Date(eventoCriado.data_fim).toLocaleDateString('pt-BR')}\n📍 ${eventoCriado.local}\n\n${eventoCriado.descricao}`,
                    imagens: validImages,
                },
            },
        });
    };

    const handleCancel = () => {
        setShowDialog(false);
        navigate('/eventos');
    };

    return (
        <>
            <Create
                title="Criar Novo Evento"
                sx={{ width: '100%', maxWidth: 600, margin: '0 auto', mb: 10 }}
                mutationOptions={{ onSuccess: handleSuccess }}
            >
                <SimpleForm
                    toolbar={<EventoToolbar />}
                >
                    <TextInput
                        source="titulo"
                        label="Título"
                        validate={required('O título é obrigatório')}
                        fullWidth
                    />

                    <CustomDatePicker
                        source="data_inicio"
                        label="Data de Início *"
                        future
                        validate={[required('A data inicial é obrigatória'), validateDataInicio]}
                    />

                    <CustomDatePicker
                        source="data_fim"
                        label="Data de Encerramento *"
                        future
                        validate={[required('A data final é obrigatória'), validateDataFim]}
                    />

                    <TextInput
                        source="local"
                        label="Local"
                        validate={required('O local é obrigatório')}
                        fullWidth
                    />

                    <TextInput
                        source="descricao"
                        label="Descrição"
                        multiline
                        rows={3}
                        validate={required('A descrição é obrigatória')}
                        fullWidth
                    />

                    <ImageInput
                        source="imagem"
                        label="Imagem de Capa"
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', 'webp'] }}
                        maxSize={10_500_000}
                        validate={required('A imagem de capa é obrigatória')}
                        placeholder={
                            <FilePlaceholder
                                maxSize={10_500_000}
                                accept={['.png', '.jpg', '.jpeg', 'webp']}
                            />
                        }
                        sx={{
                            '& .RaFileInput-dropZone': { p: 0 },
                        }}
                    >
                        <ImageField source="src" title="title" />
                    </ImageInput>

                    <ImageInput
                        source="imagens"
                        label="Imagens do Evento"
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                        maxSize={10_500_000}
                        validate={required('Pelo menos uma imagem é obrigatória')}
                        multiple
                        placeholder={
                            <FilePlaceholder
                                maxSize={10_500_000}
                                accept={['.png', '.jpg', '.jpeg', '.webp']}
                                multiple
                            />
                        }
                        sx={{
                            '& .RaFileInput-dropZone': { p: 0 },
                        }}
                    >
                        <ImageField source="src" title="title" />
                    </ImageInput>
                </SimpleForm>
            </Create>

            {/* Dialog de confirmação */}
            <Dialog open={showDialog} onClose={handleCancel}>
                <DialogTitle>
                    Deseja criar um post no Instagram sobre este evento?
                </DialogTitle>
                <DialogActions>
                    <Button onClick={handleCancel} color="secondary">
                        Não
                    </Button>
                    <Button onClick={handleConfirmPost} color="primary" autoFocus>
                        Sim
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default EventoCreate;
