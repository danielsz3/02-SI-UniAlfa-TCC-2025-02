import { DataTable, DateField, EmailField, FunctionField, List, RaRecord, SelectInput, SimpleList, TextInput } from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { CustomListActions } from '../ExportActions';
import { Badge, Box, Chip, useMediaQuery, useTheme } from '@mui/material';

const filters = [
    <TextInput label="Nome" source="nome" size="small" alwaysOn />,
    <CustomDatePicker label="Criação de" source="created_at_from" />,
    <CustomDatePicker label="Criação até" source="created_at_to" />,
    <SelectInput
        label="Tipo"
        source="role"
        size="small"
        choices={[
            { id: 'user', name: 'Usuário' },
            { id: 'admin', name: 'Administrador' },
        ]}
    />,
    <TextInput label="Email" source="email" size="small" />,
];

const formatPhone = (phone: string) => {
    if (!phone) return ''; // Retorna vazio se não houver telefone
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11) {
        return digits.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2$3-$4');
    }

    if (digits.length === 10) {
        return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return phone;
};

const calculateAge = (dataNascimento: string | number | Date) => {
    if (!dataNascimento) return null;
    const birthDate = new Date(dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Verifica se o aniversário deste ano já passou
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

const formatadorDeUsuarios = (data: RaRecord[]) => {
    return data.map(record => ({
        "Data Criação": new Date(record.created_at).toLocaleString(),
        "Tipo": record.role,
        "Nome": record.nome,
        "Email": record.email,
        "CPF": record.cpf,
        "Idade": calculateAge(record.data_nascimento),
        "Data de nascimento": new Date(record.data_nascimento).toLocaleDateString(),
        "telefone": formatPhone(record.telefone),
        "Endereço": [
            record.endereco?.logradouro,
            record.endereco?.numero,
            record.endereco?.bairro,
            record.endereco?.cidade,
            record.endereco?.uf
        ].filter(part => !!part).join(', ') || 'N/A',
    }));
};

export const UsuarioList = () => {

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <List
            filters={filters}
            actions={<CustomListActions
                formatter={formatadorDeUsuarios}
                nomeArquivo="export_usuarios"
            />}
        >
            {isSmall ? (
                <SimpleList
                    leftAvatar={(record) => {
                        if (record.imagem) {
                            return import.meta.env.VITE_API_URL + '/imagens/' + record.imagem;
                        }
                    }}
                    primaryText={(record) => record.nome}
                    secondaryText={(record) => record.email}
                    tertiaryText={(record) => record.role}
                />
            ) : (
                <DataTable rowClick="edit">
                    <DataTable.Col source="created_at" label="Data cadastro">
                        <DateField source="created_at" showTime locales={'pt-BR'} />
                    </DataTable.Col>
                    <DataTable.Col source="nome" />
                    <DataTable.Col source="email">
                        <EmailField source="email" />
                    </DataTable.Col>
                    <DataTable.Col source="data_nascimento">
                        <DateField source="data_nascimento" />
                    </DataTable.Col>
                    <DataTable.Col source="telefone">
                        <FunctionField
                            render={(record) => formatPhone(record.telefone)}
                        />
                    </DataTable.Col>
                    <DataTable.Col source="role" label="Tipo" >
                        <FunctionField
                            render={(record) => {
                                return <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: '100%'}}>
                                    <Chip
                                        sx={{ fontWeight: 'bold' }}
                                        color={record.role === 'user' ? 'primary' : 'secondary'}
                                        label={record.role === 'user' ? 'Usuário' : 'Administrador'}
                                    />
                                </Box>
                            }}
                        />
                    </DataTable.Col>
                </DataTable>
            )}
        </List>
    )
};
