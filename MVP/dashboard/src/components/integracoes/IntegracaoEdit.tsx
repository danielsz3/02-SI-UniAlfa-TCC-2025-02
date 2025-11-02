import { Button, Edit, SaveButton, SimpleForm, TextInput, required, useRedirect } from 'react-admin';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const IntegracaoToolbar = () => {
    const redirect = useRedirect();
    const handleBack = () => redirect('list', 'integracoes');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
                />
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

const IntegracaoEdit = () => (
    <Edit
        title="Editar Integração"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        redirect="list"
    >
        <SimpleForm
            toolbar={<IntegracaoToolbar />}
        >
            <TextInput
                source="username"
                label="Nome de Usuário"
                validate={required('O nome de usuário é obrigatório')}
            />

            <TextInput
                source="access_token"
                label="Token de Acesso"
                validate={required('O token de acesso é obrigatório')}
            />

            <TextInput
                source="user_id"
                label="ID do Usuário"
                validate={required('O ID do usuário é obrigatório')}
            />

        </SimpleForm>
    </Edit>
);

export default IntegracaoEdit;
