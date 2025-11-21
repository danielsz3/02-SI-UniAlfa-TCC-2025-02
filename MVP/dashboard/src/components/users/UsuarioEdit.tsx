import React from 'react';
import {
    SimpleForm,
    TextInput,
    required,
    PasswordInput,
    Edit,
    ImageInput,
    ImageField,
    useRecordContext,
    useRedirect,
    SaveButton,
    Button,
    DeleteWithConfirmButton
} from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { FilePlaceholder } from '../FilePlaceHolder';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const validatePasswordMatch = (value: string, allValues : any) => {
    if (value !== allValues.password) {
        return 'As senhas não coincidem';
    }
    return undefined;
};

const UsuarioToolbar = () => {
    const redirect = useRedirect();

    const handleBack = () => redirect('list', 'usuarios');

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
                    confirmContent="Deseja realmente excluir o usuário?"
                />,
            ]}
        />
    );
};

const UserFormContent = () => {

    const record = useRecordContext();

    const isUser = record && record.role === 'user';

    return (
        <>
            <ImageInput
                source="imagem"
                label="Imagem"
                disabled={isUser}
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

            <TextInput
                source="nome"
                label="Nome"
                disabled={isUser}
                validate={required('O nome é obrigatório')}
            />

            <TextInput
                source="cpf"
                label="CPF"
                disabled={isUser}
                validate={required('O CPF é obrigatório')}
            />

            <CustomDatePicker
                source='data_nascimento'
                label="Data de Nascimento *"
                disabled={isUser}
                validate={required('A data de nascimento é obrigatória')}
            />

            <TextInput
                source="telefone"
                label="Telefone"
                disabled={isUser}
                validate={[required('O telefone é obrigatória')]}
            />

            <TextInput
                source="email"
                label="Email"
                disabled={isUser}
                validate={[
                    required('O email é obrigatório'),
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
        </>
    );
};

const UserEdit = () => {
    return (
        <Edit
            title="Editar Usuário"
            sx={{ width: '100%', maxWidth: 600, margin: '0 auto', mb: 10 }}
            redirect="list"
        >
            <SimpleForm
             toolbar={<UsuarioToolbar />}
            >
                <UserFormContent key={0} />
            </SimpleForm>
        </Edit>
    )
};

export default UserEdit;