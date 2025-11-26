import { Edit, ImageField, ImageInput, SimpleForm, TextInput, required } from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';
import CustomDatePicker from '../datepicker/customDatePicker';

const EventoEdit = () => (
    <Edit
        title="Editar Evento"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto', mb: 10 }}
        redirect="list"
    >
        <SimpleForm>
            <TextInput
                source="titulo"
                label="Título"
                validate={required('O título é obrigatório')}
            />

            <CustomDatePicker
                source="data_inicio"
                label="Data de Início"
                future
                validate={required('A data inicial é obrigatória')}
            />

            <CustomDatePicker
                source="data_fim"
                label="Data de Encerramento"
                future
                validate={required('A data final é obrigatória')}
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
