import {
    Edit,
    TabbedForm,
    FormTab,
    TextInput,
    required,
    EditProps,
    RadioButtonGroupInput,
    useNotify,
    ImageInput,
    ImageField,
} from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FilePlaceholder } from '../FilePlaceHolder';

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
            validate={required()}
            helperText={helpText}
        />
    );
};

const LarTempEdit = (props: EditProps) => {

    return (
        <Edit
            {...props}
            title="Editar Lar Temporário"
            sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
            redirect="list"
        >
            <TabbedForm>
                <FormTab label="Responsável">
                    <RadioButtonGroupInput
                        label="Situação"
                        source="situacao"
                        choices={[
                            { id: 'ativo', name: 'Ativo' },
                            { id: 'inativo', name: 'Inativo' }
                        ]}
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
                </FormTab>

                <FormTab label="Endereço">
                    <CepInput />
                    <TextInput
                        source="endereco.logradouro"
                        label="Logradouro"
                        validate={required()}
                    />
                    <TextInput
                        source="endereco.numero"
                        label="Número"
                        validate={required()}
                    />
                    <TextInput source="endereco.complemento" label="Complemento" />
                    <TextInput
                        source="endereco.bairro"
                        label="Bairro"
                    />
                    <TextInput
                        source="endereco.cidade"
                        label="Cidade"
                        validate={required()}
                    />
                    <TextInput source="endereco.uf" label="UF" validate={required()} />
                </FormTab>

                <FormTab label="Galeria">
                    <ImageInput
                        source="imagens"
                        label="Imagens do Lar Temporário"
                        multiple
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }}
                        maxSize={10_500_000}
                        validate={required('Pelo menos uma imagem é obrigatória')}
                        placeholder={
                            <FilePlaceholder
                                maxSize={10_500_000}
                                accept={['.png', '.jpg', '.jpeg', '.gif']}
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
        </Edit>
    );
};

export default LarTempEdit;
