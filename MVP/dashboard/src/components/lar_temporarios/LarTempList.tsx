import { ChipField, DataTable, FunctionField, List, SelectInput, TextField, TextInput, DateInput } from 'react-admin';

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

const filters = [
    <TextInput label="Nome" source="nome" size="small" alwaysOn />,
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
    <SelectInput
        label="Situação"
        source="situacao"
        size="small"
        choices={[{ id: 'ativo', name: 'Ativo' }, { id: 'inativo', name: 'Inativo' }]}
    />,
];
export const LarTempList = () => (
    <List
        filters={filters}
        sort={{ field: 'created_at', order: 'DESC' }}
    >
        <DataTable rowClick="edit">
            <DataTable.Col source="created_at" label="Criação">
                <FunctionField
                    render={(record) => new Date(record.created_at).toLocaleString('pt-BR')}
                />
            </DataTable.Col>
            <DataTable.Col source="nome" />
            <DataTable.Col label="Telefone">
                <FunctionField
                    render={(record) => formatPhone(record.telefone)}
                />
            </DataTable.Col>
            <DataTable.Col label="Idade">
                <FunctionField
                    render={(record) => {
                        const age = calculateAge(record.data_nascimento);
                        return age !== null ? `${age} anos` : 'N/A';
                    }}
                />
            </DataTable.Col>
            <DataTable.Col label="Endereço">
                <FunctionField
                    render={(record) => {
                        const parts = [
                            record.endereco.logradouro,
                            record.endereco.numero,
                            record.endereco.bairro,
                            record.endereco.cidade,
                            record.endereco.uf
                        ];
                        
                        // Filtra partes vazias (null, undefined, "") e junta com vírgula
                        const address = parts.filter(part => !!part).join(', ');
                        return address || 'N/A';
                    }}
                />
            </DataTable.Col>
            
            <DataTable.Col label="Situação" >
                <FunctionField
                    render={(record) => {
                        const color = record.situacao === 'ativo' ? 'forestgreen' : 'red';
                        return <ChipField source="situacao" record={record} style={{ backgroundColor: color, color: 'white' }} />
                    }}
                />
            </DataTable.Col>

        </DataTable>
    </List>
);