import { Create, FileField, FileInput, SimpleForm, TextInput, required } from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';

const ArquivoCreate = () => (
    <Create
        title="Criar Novo Documento"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        redirect="list"
    >
        <SimpleForm>
            <TextInput
                source="titulo"
                label="Título"
                validate={required('O título é obrigatório')}
            />

            <TextInput
                source="categoria"
                label="Categoria"
                validate={required('Pelo menos uma categoria é obrigatória')}
            />

            <TextInput
                source="descricao"
                label="Descrição"
                multiline
                rows={3}
                validate={required('A descrição é obrigatória')}
            />

            <FileInput
                source="arquivo"
                label="Arquivo"
                accept={{ 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'], 'application/vnd.ms-excel': ['.xls', '.xlsx'], 'text/csv': ['.csv'] }}
                maxSize={5000000}
                placeholder={
                    <FilePlaceholder
                        maxSize={5_200_000}
                        accept={[".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"]}
                    />
                }
                validate={required('O arquivo é obrigatório')}
                sx={{
                    '& .RaFileInput-dropZone': {
                        p: 0,
                    },
                }}
            >
                <FileField source="src" title="title" />
            </FileInput>

        </SimpleForm>
    </Create>
);

export default ArquivoCreate;
