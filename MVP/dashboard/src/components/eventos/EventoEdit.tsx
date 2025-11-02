import { Button, DeleteWithConfirmButton, Edit, ImageField, ImageInput, SaveButton, SimpleForm, TextInput, required, useRedirect } from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';
import CustomDatePicker from '../datepicker/customDatePicker';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

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

    const handleBack = () => redirect('list', 'eventos');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
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
        <SimpleForm
            toolbar={<EventoToolbar />}
        >
            <TextInput
                source="titulo"
                label="Título"
                validate={required('O título é obrigatório')}
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
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }}
                maxSize={10_500_000}
                validate={required('A imagem de capa é obrigatória')}
                placeholder={
                    <FilePlaceholder
                        maxSize={10_500_000}
                        accept={['.png', '.jpg', '.jpeg', '.gif']}
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
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }}
                maxSize={10_500_000}
                validate={required('Pelo menos uma imagem é obrigatória')}
                multiple
                placeholder={
                    <FilePlaceholder
                        maxSize={10_500_000}
                        accept={['.png', '.jpg', '.jpeg', '.gif']}
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
