import { Button, Create, FileField, FileInput, SaveButton, SimpleForm, TextInput, required } from 'react-admin';
import { FilePlaceholder } from '../FilePlaceHolder';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useFormContext } from 'react-hook-form';
import { useNotify } from 'react-admin';
import { useRedirect } from 'react-admin';

const ArquivoToolbar = () => {
    const redirect = useRedirect();
    const notify = useNotify();
    const form = useFormContext();

    const handleBack = () => redirect('list', 'documentos');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
                    mutationOptions={{
                        onSuccess: () => {
                            notify('Documento salvo com sucesso!', { type: 'success' });
                            redirect('list', 'documentos');
                        },
                    }}
                />,
                <SaveButton
                    type='button'
                    sx={{fontSize: "0.8rem"}}
                    label='Salvar e Novo'
                    variant='outlined'
                    mutationOptions={{
                        onSuccess: () => {
                            notify('Documento salvo com sucesso! Pronto para criar outro', { type: 'info' });
                            redirect('create', 'documentos');
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

const ArquivoCreate = () => (
    <Create
        title="Criar Novo Documento"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
    >
        <SimpleForm
            toolbar={<ArquivoToolbar />}
        >
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
                maxSize={10_500_000}
                placeholder={
                    <FilePlaceholder
                        maxSize={10_500_000}
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
