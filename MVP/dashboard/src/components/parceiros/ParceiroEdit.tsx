import { Edit, ImageField, ImageInput, SimpleForm, TextInput, required } from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';

const ParceiroEdit = () => (
    <Edit
        title="Editar Parceiro"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        redirect="list"
    >
        <SimpleForm>
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

export default ParceiroEdit;
