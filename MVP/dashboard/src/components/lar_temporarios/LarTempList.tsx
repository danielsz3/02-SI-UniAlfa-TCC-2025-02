import { ChipField, DataTable, FunctionField, List, SelectInput, TextField, TextInput } from 'react-admin';

const filters = [
    <TextInput label="Nome" source="nome" size="small" alwaysOn />,
    <SelectInput
        label="Situação"
        source="situacao"
        size="small"
        choices={[{ id: 'ativo', name: 'Ativo' }, { id: 'inativo', name: 'Inativo' }]}
    />,
];
export const LarTempList = () => (
    <List filters={filters}>
        <DataTable rowClick="edit">
            <DataTable.Col source="id" />
            <DataTable.Col source="nome" />
            <DataTable.Col source="telefone" >
                <TextField source="telefone" label="Telefone" />
            </DataTable.Col >
            <DataTable.Col source="situacao" label="Situação" >
                <FunctionField
                    render={(record) => {
                        const color = record.situacao === 'ativo' ? 'forestgreen' : 'red';
                        return <ChipField source="situacao" style={{ backgroundColor: color, color: 'white' }} />
                    }}
                />
            </DataTable.Col>

        </DataTable>
    </List>
);