import { DataTable, DateField, EmailField, List, SelectInput, TextInput } from 'react-admin';

const filters = [
    <TextInput label="Nome" source="nome" size="small" alwaysOn />,
    <SelectInput
        label="Tipo"
        source="role"
        size="small"
        choices={[{ id: 'user', name: 'Usuário' }, { id: 'admin', name: 'Administrador' }]}
    />,
    <TextInput label="Email" source="email" size="small" />,
];
export const UsuarioList = () => (
    <List filters={filters}>
        <DataTable rowClick="edit">
            <DataTable.Col source="id" />
            <DataTable.Col source="nome" />
            <DataTable.Col source="email">
                <EmailField source="email" />
            </DataTable.Col>
            <DataTable.Col source="data_nascimento">
                <DateField source="data_nascimento"/>
            </DataTable.Col>
            <DataTable.Col source="telefone"/>
            <DataTable.Col source="role" />
        </DataTable>
    </List>
);