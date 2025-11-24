import {
    Button,
    DeleteWithConfirmButton,
    Edit,
    ImageField,
    ImageInput,
    SaveButton,
    SimpleForm,
    TextInput,
    required,
    useRedirect,
} from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';
import CustomDatePicker from '../datepicker/customDatePicker';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

/**
 * Normaliza data para comparar só AAAA-MM-DD (zerando horas).
 */
const normalizeDate = (value: string | number | Date) => {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Validador para a DATA DE INÍCIO.
 * - Permite hoje
 * - Permite ser igual à data de fim
 */
const validateDataInicio = (
    value: string | number | Date,
    allValues: { data_fim: string | number | Date }
) => {
    if (!value) return undefined;

    const dataInicio = normalizeDate(value);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataInicio < hoje) {
        return 'A data de início deve ser hoje ou uma data futura';
    }

    if (allValues?.data_fim) {
        const dataFim = normalizeDate(allValues.data_fim);

        if (dataInicio > dataFim) {
            return 'A data de início não pode ser posterior à data de encerramento';
        }
    }

    return undefined;
};

const validateDataFim = (
    value: string | number | Date,
    allValues: { data_inicio: string | number | Date }
) => {
    if (!value || !allValues?.data_inicio) return undefined;

    const dataInicio = normalizeDate(allValues.data_inicio);
    const dataFim = normalizeDate(value);

    if (dataFim < dataInicio) {
        return 'A data de encerramento não pode ser anterior à data de início';
    }

    return undefined;
};

const EventoToolbar = () => {
    const redirect = useRedirect();

    const handleBack = () => redirect('list', 'eventos');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type="button"
                />,
            ]}
            rightButtons={[
                <Button
                    label="Voltar"
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={handleBack}
                />,
                <DeleteWithConfirmButton
                    confirmTitle="Tem certeza?"
                    confirmContent="Deseja realmente excluir o evento?"
                />,
            ]}
        />
    );
};

const EventoEdit = () => (
    <Edit
        title="Editar Evento"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto', mb: 10 }}
        redirect="list"
    >
        <SimpleForm toolbar={<EventoToolbar />}>
            <TextInput
                source="titulo"
                label="Título"
                validate={required('O título é obrigatório')}
            />

            <CustomDatePicker
                source="data_inicio"
                label="Data de Início *"
                future
                validate={[
                    required('A data inicial é obrigatória'),
                    validateDataInicio,
                ]}
            />

            <CustomDatePicker
                source="data_fim"
                label="Data de Encerramento *"
                future
                validate={[
                    required('A data final é obrigatória'),
                    validateDataFim,
                ]}
            />

            <TextInput
                source="local"
                label="Local"
                validate={required('O local é obrigatório')}
            />

            <TextInput
                source="descricao"
                label="Descrição"
                multiline
                rows={3}
                validate={required('A descrição é obrigatória')}
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
                    '& .RaFileInput-dropZone': {
                        p: 0,
                    },
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
                    '& .RaFileInput-dropZone': {
                        p: 0,
                    },
                }}
            >
                <ImageField source="src" title="title" />
            </ImageInput>
        </SimpleForm>
    </Edit>
);

export default EventoEdit;