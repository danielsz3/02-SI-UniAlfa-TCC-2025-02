import { Button, DeleteWithConfirmButton, Edit, ImageField, ImageInput, SaveButton, SimpleForm, TextInput, required, useNotify, useRedirect } from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const ParceiroToolbar = () => {
    const redirect = useRedirect();

    const handleBack = () => redirect('list', 'parceiros');

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
                    confirmContent="Deseja realmente excluir o parceiro(a)?"
                />,
            ]}
        />
    );
};

const ParceiroEdit = () => (
    <Edit
        title="Editar Parceiro"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        redirect="list"
    >
        <SimpleForm
            toolbar={<ParceiroToolbar />}
        >
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

export default ParceiroEdit;
