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
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useFormContext } from 'react-hook-form';
import { CustomToolbar } from '../CustomToolbar';

const ParceiroToolbar = () => {
    const redirect = useRedirect();
    const notify = useNotify();
    const form = useFormContext(); // agora funciona dentro do <SimpleForm>

    const handleBack = () => redirect('list', 'parceiros');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
                />,
                <SaveButton
                    type='button'
                    sx={{fontSize: "0.8rem"}}
                    label='Salvar e Novo'
                    variant='outlined'
                    mutationOptions={{
                        onSuccess: () => {
                            notify('Parceiro salvo com sucesso! Pronto para criar outro', { type: 'info' });
                            redirect('create', 'parceiros');
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

const ParceiroCreate = () => (
    <Create
        title="Criar Novo Parceiro"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
    >
        <SimpleForm toolbar={<ParceiroToolbar />}>
            <TextInput
                source="nome"
                label="Nome"
                validate={required('O nome é obrigatório')}
            />

            <TextInput
                source="url_site"
                label="Site da Empresa"
                validate={required('O site é obrigatório')}
            />

            <TextInput
                source="descricao"
                label="Descrição"
                validate={[required('A descrição é obrigatória')]}
            />

            <ImageInput
                source="imagem"
                label="Imagem"
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }}
                maxSize={10_500_000}
                validate={required('Pelo menos uma imagem é obrigatória')}
                placeholder={
                    <FilePlaceholder
                        maxSize={10_500_000}
                        accept={['.png', '.jpg', '.jpeg', '.gif']}
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
);

export default ParceiroCreate;
