import { DataTable, List, RaRecord, SelectInput } from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { CustomListActions } from '../ExportActions';

const formatadorDeAdocoes = (data: RaRecord[]) => {
    return data.map(record => ({
        'Data de criação': new Date(record.created_at).toLocaleDateString(),
        'Usuário': record.usuario.nome,
        "Animal": record.animal?.nome ?? 'N/A',
        "Situação": record.situacao
    }));
};

const filters = [
    <SelectInput
        label="Situação"
        source="status"
        size="small"
        choices={[
            { id: 'em_aprovacao', name: 'Em Aberto' },
            { id: 'aprovado', name: 'Aprovado' }

        ]}
        alwaysOn
    />,
    <CustomDatePicker
        label="Criado a partir de"
        source="created_at_from"
        alwaysOn
        past
    />,
    <CustomDatePicker
        label="Criado até"
        source="created_at_to"
        alwaysOn
        past
    />,
];
export const AdocaoList = () => (
    <List filters={filters}
        actions={<CustomListActions
            formatter={formatadorDeAdocoes}
            nomeArquivo="export_adocoes"
        />}
    >
        <DataTable rowClick="edit">
            <DataTable.Col source="id" />
            <DataTable.Col source="usuario.nome" disableSort>
            </DataTable.Col>
            <DataTable.Col source="animal.nome" disableSort>
            </DataTable.Col>
            <DataTable.Col source="status" />
        </DataTable>
    </List>
);