import { Button, DeleteWithConfirmButton, Edit, NumberInput, SaveButton, SelectInput, SimpleForm, TextInput, required, useRedirect } from 'react-admin';
import CustomDateTimePicker from '../datepicker/customDateTimePicker';
import Grid from '@mui/material/Grid';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const validateValor = (value: number) => {
    if (!value) {
        return 'O valor é obrigatório';
    }
    if (value <= 0) {
        return 'O valor deve ser maior que zero';
    }
    return undefined;
};

const TransacaoToolbar = () => {
    const redirect = useRedirect();

    const handleBack = () => redirect('list', 'transacoes');

    return (
        <CustomToolbar
            key={"record"}
            leftButtons={[
                <SaveButton
                    type='button'
                />
            ]}
            rightButtons={[
                <Button
                    label="Voltar"
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={handleBack}
                />,
                <DeleteWithConfirmButton
                    confirmTitle="Tem certeza?"
                    confirmContent="Tem certeza que deseja excluir essa transação?"
                />
            ]}
        />
    );
};

const TransacaoEdit = () => (
    <Edit
        title="Editar Transação"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        redirect="list"
    >
        <SimpleForm
            toolbar={<TransacaoToolbar />}
        >
            <Grid container spacing={1} columns={2}>
                <Grid size={{ xs: 1 }}>
                    <SelectInput
                        label="Tipo"
                        source="tipo"
                        choices={[
                            { id: 'receita', name: 'Receita' },
                            { id: 'despesa', name: 'Despesa' }
                        ]}
                        validate={required('O tipo é obrigatório')}
                    />
                </Grid>
                <Grid size={{ xs: 1 }}>
                    <NumberInput
                        source="valor"
                        label="Valor R$"
                        validate={[validateValor]}
                    />
                </Grid>
                <Grid size={{ xs: 1 }}>
                    <CustomDateTimePicker
                        source="data"
                        label="Data da Transação *"
                        validate={required('A data da transação é obrigatória')}
                    />
                </Grid>
                <Grid size={{ xs: 1 }}>
                    <TextInput
                        source="categoria"
                        label="Categoria"
                        validate={required('Pelo menos uma categoria é obrigatória')}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextInput
                        source="descricao"
                        label="Descrição"
                        validate={required('A descrição é obrigatória')}
                    />
                </Grid>
                <Grid size={{ xs: 1 }}>
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
                        validate={required('A Forma de pagamento é obrigatória')}
                    />
                </Grid>
                <Grid size={{ xs: 1 }}>
                    <SelectInput
                        source="situacao"
                        label="Situação"
                        choices={[
                            { id: 'concluido', name: 'Concluído' },
                            { id: 'pendente', name: 'Pendente' },
                            { id: 'cancelado', name: 'Cancelado' },
                        ]}
                        validate={required('A Situação é obrigatória')}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextInput
                        source="observacao"
                        label="Observações"
                        multiline
                        rows={4}
                    />
                </Grid>
            </Grid>

        </SimpleForm>
    </Edit>
);

export default TransacaoEdit;
