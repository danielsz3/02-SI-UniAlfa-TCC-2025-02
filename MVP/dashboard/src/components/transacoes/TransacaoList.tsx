import { ChipField, DataTable, DateField, FunctionField, List, NumberField, NumberInput, Pagination, PaginationProps, RaRecord, SelectInput, TextInput } from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { CustomListActions } from '../ExportActions';
import { JSX } from 'react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const formatadorDeTransacoes = (data: RaRecord[]) => {
    return data.map(record => ({
        'Data': new Date(record.data).toLocaleString(),
        'Valor': formatCurrency(record.valor),
        "Tipo": record.tipo,
        "Situação": record.situacao,
        'Descrição': record.descricao,
        'Categoria': record.categoria,
        "Forma de pagamento": record.forma_pagamento,
        "Observação": record.observacao
    }));
};

const filters = [
    <NumberInput label="Valor" source="valor" size="small" alwaysOn />,
    <SelectInput
        label="Tipo"
        source="tipo"
        size="small"
        choices={[
            { id: 'receita', name: 'Receita' },
            { id: 'despesa', name: 'Despesa' },
        ]}
        alwaysOn
    />,
    <TextInput label="Categoria" source="categoria" size="small" />,
    <SelectInput
        source="forma_pagamento"
        label="Forma de Pagamento"
        choices={[
            { id: 'pix', name: 'PIX' },
            { id: 'dinheiro', name: 'Dinheiro' },
            { id: 'cartao', name: 'Cartão' },
            { id: 'cheque', name: 'Cheque' },
            { id: 'transferencia', name: 'Transferência' },
        ]}
    />,
    <CustomDatePicker
        label="Criado a partir de"
        source="data_at_from"
        past
        future
    />,
    <CustomDatePicker
        label="Criado até"
        source="data_at_to"
        past
        future
    />,
];

const Pag = (props: JSX.IntrinsicAttributes & PaginationProps) => (
    <Pagination rowsPerPageOptions={[10, 25, 50, 100, 500]}  {...props} />
);

export const TransacaoList = () => (
    <List
        filters={filters}
        sort={{ field: 'created_at', order: 'DESC' }}
        actions={<CustomListActions
            formatter={formatadorDeTransacoes}
            nomeArquivo="export_transacoes"
        />}
        pagination={<Pag />}
    >
        <DataTable rowClick="edit">
            <DataTable.Col source="data" label="Data">
                <DateField source="data" showTime locales={'pt-BR'} />
            </DataTable.Col>
            <DataTable.Col source="tipo" label="Tipo">
                <FunctionField
                    render={(record) => {
                        record.tipo = record.tipo.toUpperCase();
                        const color = record.tipo === 'RECEITA' ? 'green' : 'red';
                        return <ChipField source="tipo" style={{ backgroundColor: color, color: 'white' }} />
                    }}
                />
            </DataTable.Col>
            <DataTable.Col source="valor">
                <FunctionField
                    render={(record) => {
                        record.tipo = record.tipo.toUpperCase();
                        const color = record.tipo === 'RECEITA' ? 'green' : 'red';
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