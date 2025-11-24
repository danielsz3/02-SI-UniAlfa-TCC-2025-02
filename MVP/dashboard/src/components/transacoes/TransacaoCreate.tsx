import { Button, Create,NumberInput, SaveButton, SelectInput, SimpleForm, TextInput, minValue, required } from 'react-admin';
import CustomDateTimePicker from '../datepicker/customDateTimePicker';
import Grid from '@mui/material/Grid';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useFormContext } from 'react-hook-form';
import { useNotify } from 'react-admin';
import { useRedirect } from 'react-admin';

const TransacaoToolbar = () => {
    const redirect = useRedirect();
    const notify = useNotify();
    const form = useFormContext();

    const handleBack = () => redirect('list', 'transacoes');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
                />,
                <SaveButton
                    type='button'
                    sx={{fontSize: "0.8rem"}}
                    label='Salvar e Novo'
                    variant='outlined'
                    mutationOptions={{
                        onSuccess: () => {
                            notify('Transação salva com sucesso! Pronto para criar outra', { type: 'info' });
                            redirect('create', 'transacoes');
                            form.reset();
                        },
                    }}
                />,
            ]}
            rightButtons={[
                <Button
                    label="Voltar"
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={handleBack}
                />,
            ]}
        />
    );
};

const TransacaoCreate = () => (
    <Create
        title="Criar Nova Transação"
        sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        redirect="list"
    >
        <SimpleForm
            toolbar={<TransacaoToolbar />}
        >
            <Grid container spacing={2} columns={2}>
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
                        validate={[
                            required('O valor é obrigatório'),
                            minValue('O valor deve ser maior que zero', 0)
                        ]}
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
    </Create>
);

export default TransacaoCreate;
