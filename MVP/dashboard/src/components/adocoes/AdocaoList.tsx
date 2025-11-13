import { AutocompleteInput, DataTable, FunctionField, List, Pagination, PaginationProps, RaRecord, ReferenceInput, SelectInput, useRecordContext } from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { CustomListActions } from '../ExportActions';
import { Avatar, Box } from '@mui/material';
import { JSX } from 'react';

const formatadorDeAdocoes = (data: RaRecord[]) => {
    return data.map(record => ({
        'Data de criação': new Date(record.created_at).toLocaleDateString(),
        'Usuário': record.usuario.nome,
        "Animal": record.animal?.nome ?? 'N/A',
        "Situação": record.situacao
    }));
};

const AnimalSuggestionOption = () => {
    const record = useRecordContext();
    if (!record) return null;

    return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
                src={`${import.meta.env.VITE_API_URL}/imagens/${record.imagens[0]?.caminho}`}
                alt={record.nome}
                sx={{ mr: 1, width: 24, height: 24 }}
            />
            {record.nome} - {record.tipo_animal}
        </Box>
    );
};

const UserSuggestionOption = () => {
    const record = useRecordContext();
    if (!record) return null;
    return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={`${import.meta.env.VITE_API_URL}/imagens/${record.imagem}`} alt={record.nome} sx={{ mr: 1, width: 24, height: 24 }} />
            {record.nome}
        </Box>
    );
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
    <ReferenceInput source="usuario_id" reference="usuarios" alwaysOn>
        <AutocompleteInput
            label="Adotante"
            optionText={<UserSuggestionOption />}
            inputText={(record) => record.nome}
        />
    </ReferenceInput>,
    <ReferenceInput source="animal_id" reference="animais" alwaysOn>
        <AutocompleteInput
            label="Animal"
            optionText={<AnimalSuggestionOption />}
            inputText={(record) => record.nome}
        />
    </ReferenceInput>,
    <CustomDatePicker
        label="Criado a partir de"
        source="created_at_from"
        past
    />,
    <CustomDatePicker
        label="Criado até"
        source="created_at_to"
        past
        future
    />,
];

const Pag = (props: JSX.IntrinsicAttributes & PaginationProps) => (
    <Pagination rowsPerPageOptions={[20, 40, 60, 120]}  {...props} />
);

export const AdocaoList = () => (
    <List
        filters={filters}
        actions={<CustomListActions
            formatter={formatadorDeAdocoes}
            nomeArquivo="export_adocoes"
        />}
        perPage={20}
        pagination={<Pag />}
    >
        <DataTable rowClick="edit"
            sort={{ field: 'created_at', order: 'DESC' }}
            size='medium'
        >
            <DataTable.Col source="id" />
            <DataTable.Col source="usuario" disableSort label="Adotante">
                <FunctionField
                    render={
                        record =>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                    src={`${import.meta.env.VITE_API_URL}/imagens/${record.usuario.imagem}`}
                                    alt={record.usuario.nome}
                                    sx={{ mr: 1, width: 24, height: 24 }} />
                                {record.usuario.nome}
                            </Box>
                    }
                />
            </DataTable.Col>
            <DataTable.Col source="animal" disableSort>
                <FunctionField
                    render={
                        record =>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                    src={`${import.meta.env.VITE_API_URL}/imagens/${record.animal.imagens[0]?.caminho}`}
                                    alt={record.animal.nome}
                                    sx={{ mr: 1, width: 24, height: 24 }} />
                                {record.animal.nome}
                            </Box>
                    }
                />
            </DataTable.Col>
            <DataTable.Col source="status" />
        </DataTable>
    </List>
);