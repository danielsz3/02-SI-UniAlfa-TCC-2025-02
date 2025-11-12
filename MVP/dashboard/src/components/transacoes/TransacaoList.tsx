import { ChipField, DataTable, DateField, FunctionField, List, NumberField, NumberInput, DateInput } from 'react-admin';

const filters = [
    <NumberInput label="Valor" source="valor" size="small" alwaysOn />,
    <DateInput
                label="Criado a partir de"
                source="created_at_from"
                alwaysOn
            />,
            <DateInput
                label="Criado até"
                source="created_at_to"
                alwaysOn
            />,
];
export const TransacaoList = () => (
    <List filters={filters}>
        <DataTable rowClick="edit">
            <DataTable.Col source="data" label="Data">
                <DateField source="data" showTime locales={'pt-BR'} />
            </DataTable.Col>
            <DataTable.Col source="tipo" label="Tipo">
                <FunctionField
                    render={(record) => {
                        const color = record.tipo === 'RECEITA' ? 'green' : 'red';
                        record.tipo = record.tipo.toUpperCase();
                        return <ChipField source="tipo" style={{ backgroundColor: color, color: 'white' }} />
                    }}
                />
            </DataTable.Col>
            <DataTable.Col source="valor">
                <FunctionField
                    render={(record) => {
                        const color = record.tipo === 'RECEITA' ? 'green' : 'red';
                        record.tipo = record.tipo.toUpperCase();
                        return <NumberField
                            source="valor"
                            options={{ style: 'currency', currency: 'BRL' }}
                            sx={{ textAlign: 'right', color: color }}
                        />
                    }}
                />
            </DataTable.Col>
            <DataTable.Col source="descricao" />
            <DataTable.Col source="categoria" />
        </DataTable>
    </List>
);