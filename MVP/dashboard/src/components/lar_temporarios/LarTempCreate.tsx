import {
    Create,
    TabbedForm,
    FormTab,
    TextInput,
    required,
    CreateProps,
    RadioButtonGroupInput,
    useNotify,
    ImageInput,
    ImageField,
    useRedirect,
    SaveButton,
    Button,
    regex,
} from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FilePlaceholder } from '../FilePlaceHolder';
import { CustomToolbar } from '../CustomToolbar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const CepInput = () => {
    const { setValue, watch } = useFormContext();
    const cep = watch("endereco.cep"); // observa o campo de CEP
    const notify = useNotify();
    const [helpText, setHelpText] = useState("Digite o CEP para preencher automaticamente o endereço");

    useEffect(() => {
        const fetchAddress = async () => {
            if (cep && /^\d{8}$/.test(cep)) { // ViaCEP espera 8 dígitos
                setHelpText("Buscando endereço...");
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();
                    if (data.erro) {
                        setHelpText("CEP não encontrado");
                        notify("CEP não encontrado", { type: 'warning' });
                        return;
                    }
                    // Atualiza os campos de endereço automaticamente
                    setValue("endereco.logradouro", data.logradouro || "");
                    setValue("endereco.bairro", data.bairro || "");
                    setValue("endereco.cidade", data.localidade || "");
                    setValue("endereco.uf", data.uf || "");
                    setHelpText("Endereço preenchido automaticamente");
                } catch (error) {
                    console.error("Erro ao buscar o CEP:", error);
                    notify("Erro ao buscar o CEP", { type: 'error' });
                }
            }
        };
        fetchAddress();
    }, [cep, setValue, notify]);

    return (
        <TextInput
            source="endereco.cep"
            label="CEP"
            validate={[required('O CEP é obrigatório'),regex(/^\d{8}$/, 'O CEP deve ter 8 dígitos')]}
            helperText={helpText}
        />
    );
};

const LarTempToolbar = () => {
    const redirect = useRedirect();
    const notify = useNotify();
    const form = useFormContext();

    const handleBack = () => redirect('list', 'lares-temporarios');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
                    mutationOptions={{
                        onSuccess: () => {
                            notify('Lar Temporário salvo com sucesso!', { type: 'success' });
                            redirect('list', 'lares-temporarios');
                        },
                    }}
                />,
                <SaveButton
                    type='button'
                    sx={{fontSize: "0.8rem"}}
                    label='Salvar e Novo'
                    variant='outlined'
                    mutationOptions={{
                        onSuccess: () => {
                            notify('Lar Temporário salvo com sucesso! Pronto para criar outro', { type: 'info' });
                            redirect('create', 'lares-temporarios');
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
                />
            ]}
        />
    );
};

const LarTempCreate = (props: CreateProps) => {
    return (
        <Create
            {...props}
            title="Criar Novo Lar Temporário"
            sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
        >
            <TabbedForm
                toolbar={<LarTempToolbar />}
            >
                <FormTab label="Responsável">
                    <RadioButtonGroupInput
                        label="Situação"
                        source="situacao"
                        choices={[
                            { id: 'ativo', name: 'Ativo' },
                            { id: 'inativo', name: 'Inativo' }
                        ]}
                        defaultValue={'ativo'}
                        validate={required('A situação é obrigatório')}
                    />

                    <TextInput
                        source="nome"
                        label="Nome Completo"
                        validate={required('O nome é obrigatório')}
                    />
                    <TextInput
                        source="telefone"
                        label="Telefone"
                        validate={required('O telefone é obrigatório')}
                    />
                    <CustomDatePicker
                        source="data_nascimento"
                        label="Data de Nascimento"
                        validate={required('A data de nascimento é obrigatória')}
                    />

                    <TextInput
                        source="Experiência"
                        label="Experiência com animais (opcional)"
                        multiline
                        minRows={3}
                        maxRows={5}
                        placeholder="Descreva a experiência com animais"
                    />
                </FormTab>

                <FormTab label="Endereço">

                    <CepInput />

                    <TextInput
                        source="endereco.logradouro"
                        label="Logradouro"
                        validate={required('O logradouro é obrigatório')}
                    />
                    <TextInput
                        source="endereco.numero"
                        label="Número"
                        validate={required('O número é obrigatório')}
                    />
                    <TextInput
                        source="endereco.complemento"
                        label="Complemento" />

                    <TextInput
                        source="endereco.bairro"
                        label="Bairro"
                        validate={required('O bairro é obrigatório')}
                    />

                    <TextInput
                        source="endereco.cidade"
                        label="Cidade"
                        validate={required('A cidade é obrigatória')}
                    />

                    <TextInput
                        source="endereco.uf"
                        label="UF"
                        validate={required('A UF é obrigatória')}
                    />
                </FormTab>

                <FormTab label="Galeria">
                    <ImageInput
                        source="imagens"
                        label="Imagens do Lar Temporário"
                        multiple
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                        maxSize={10_500_000}
                        validate={required('Pelo menos uma imagem é obrigatória')}
                        placeholder={
                            <FilePlaceholder
                                maxSize={10_500_000}
                                accept={['.png', '.jpg', '.jpeg', '.webp']}
                                multiple
                            />
                        }
                        sx={{
                            '& .RaFileInput-dropZone': {
                                p: 0,
                            },
                        }}
                    >
                        <ImageField source="src" title="title" />
                    </ImageInput>
                </FormTab>
            </TabbedForm>
        </Create>
    );
};

export default LarTempCreate;
