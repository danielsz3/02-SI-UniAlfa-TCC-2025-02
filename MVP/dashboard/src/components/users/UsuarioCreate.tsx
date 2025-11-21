import { Create, SimpleForm, TextInput, required, PasswordInput, ImageInput, ImageField, useRedirect, SaveButton, Button, DeleteWithConfirmButton, useNotify } from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { FilePlaceholder } from '../FilePlaceHolder';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useFormContext } from 'react-hook-form';

const validatePasswordMatch = (value: string, allValues: any) => {
    if (value !== allValues.password) {
        return 'As senhas não coincidem';
    }
    return undefined;
};

const UsuarioToolbar = () => {
    const redirect = useRedirect();
    const notify = useNotify();
    const form = useFormContext();
    const handleBack = () => redirect('list', 'usuarios');

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
                            notify('Usuário salvo com sucesso! Pronto para criar outro', { type: 'info' });
                            redirect('create', 'usuarios');
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
                />,
                <DeleteWithConfirmButton
                    confirmTitle="Tem certeza?"
                    confirmContent="Deseja realmente excluir o usuário?"
                />,
            ]}
        />
    );
};

const UserCreate = () => (
    <Create
        title="Criar Novo Usuário"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        redirect="list"
    >
        <SimpleForm
            toolbar={<UsuarioToolbar />}
        >
            <TextInput
                source="nome"
                label="Nome"
                validate={required('O nome é obrigatório')}
            />

            <TextInput
                source="cpf"
                label="CPF"
                validate={required('O CPF é obrigatório')}
            />

            <CustomDatePicker
                source='data_nascimento'
                label="Data de Nascimento *"
                validate={required('A data de nascimento é obrigatória')}
                past
            />

            <TextInput
                source="telefone"
                label="Telefone"
                validate={[required('O telefone é obrigatório')]}
            />

            <TextInput
                source="email"
                label="Email"
                validate={[required('O email é obrigatório'),
                (value) => value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) && 'O email é inválido'
                ]}
            />

            <PasswordInput
                source="password"
                label="Senha"
                validate={[required('A senha é obrigatória'),
                (value) => value && !/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/i.test(value) && 'A senha é inválido'
                ]}
            />

            <PasswordInput
                source="password_confirmation"
                label="Confirmar Senha"
                validate={validatePasswordMatch}
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
    </Create>
);

export default UserCreate;

