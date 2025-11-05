// OngEdit.tsx
import {
    TabbedForm,
    FormTab,
    TextInput,
    required,
    EditProps,
    useNotify,
    ImageInput,
    ImageField,
    SimpleFormIterator,
    ArrayInput,
    EditBase,
    TopToolbar,
    Button,
    Toolbar,
    SaveButton,
    SelectInput,
    regex,
} from 'react-admin';
import CustomDatePicker from '../datepicker/customDatePicker';
import { useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FilePlaceholder } from '../FilePlaceHolder';
import { Card, Container, Grid } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const CepInput = () => {
    const { setValue, watch } = useFormContext();
    const cep = watch("cep");
    const notify = useNotify();
    const [helpText, setHelpText] = useState("Digite o CEP para preencher automaticamente o endereço");

    useEffect(() => {
        const fetchAddress = async () => {
            if (cep && /^\d{8}$/.test(cep)) {
                setHelpText("Buscando endereço...");
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();
                    if (data.erro) {
                        setHelpText("CEP não encontrado");
                        notify("CEP não encontrado", { type: 'warning' });
                        return;
                    }
                    setValue("logradouro", data.logradouro || "");
                    setValue("bairro", data.bairro || "");
                    setValue("cidade", data.localidade || "");
                    setValue("estado", data.uf || "");
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
            source="cep"
            label="CEP"
            validate={[required('O CEP é obrigatório'),regex(/^\d{8}$/, 'O CEP deve ter 8 dígitos')]}
            helperText={helpText}
        />
    );
};

const OngEdit = (props: EditProps) => {

    return (
        <EditBase
            {...props}
            resource="ongs"
            title="Editar ONG"
            redirect='edit'
        >
            <Container>
                <Card
                    sx={{ width: '100%', maxWidth: 600, margin: '0 auto', mt: 2 }}
                >
                    <TabbedForm
                        toolbar={
                            <Toolbar>
                                <SaveButton alwaysEnable 
                                    label='Atualizar'
                                />
                            </Toolbar>
                        }
                    >
                        <FormTab label="Informações">
                            <TextInput
                                source="nome"
                                label="Nome da ONG"
                                validate={required('O nome é obrigatório')}
                            />
                            <TextInput
                                source="razao_social"
                                label="Razão Social"
                                validate={required('A razão social é obrigatória')}
                            />
                            <TextInput
                                source="cnpj"
                                label="CNPJ"
                                validate={required('O CNPJ é obrigatório')}
                            />
                            <TextInput
                                source="descricao"
                                label="Descrição"
                                validate={required("A descrição é obrigatória")}
                                multiline
                                rows={3}
                            />

                            <ImageInput
                                source="imagem"
                                label="Imagem de Capa"
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }}
                                maxSize={10_500_000}
                                validate={required('Pelo menos uma imagem é obrigatória')}
                                placeholder={
                                    <FilePlaceholder
                                        maxSize={10_500_000}
                                        accept={['.png', '.jpg', '.jpeg', '.gif']}
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

                        <FormTab label="Endereço">
                            <CepInput />
                            <TextInput source="logradouro" label="Logradouro" validate={required('O logradouro é obrigatório')} />
                            <TextInput source="numero" label="Número" validate={required('O número é obrigatório')} />
                            <TextInput source="complemento" label="Complemento" />
                            <TextInput source="bairro" label="Bairro" validate={required('O bairro é obrigatório')} />
                            <TextInput source="cidade" label="Cidade" validate={required('A cidade é obrigatória')} />
                            <TextInput source="uf" label="UF" validate={required('A UF é obrigatória')} />
                        </FormTab>

                        <FormTab label="Contatos">
                            <ArrayInput source="contatos" label="Todos os Contatos">
                                <SimpleFormIterator
                                    disableReordering
                                    disableClear
                                    getItemLabel={index => `#${index + 1}`}
                                    sx={{ marginTop: 3, width: '100%' }} // Garante que o iterador use a largura total
                                >
                                    <Grid container spacing={2} sx={{ width: '100%' }}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <SelectInput
                                                source="tipo"
                                                label="Tipo de Contato"
                                                choices={[
                                                    { id: 'telefone', name: 'Telefone' },
                                                    { id: 'email', name: 'E-mail' },
                                                    { id: 'whatsapp', name: 'Whatsapp' },
                                                    { id: 'facebook', name: 'Facebook' },
                                                    { id: 'site', name: 'Site' },
                                                    { id: 'outro', name: 'Outro' }
                                                ]}
                                                validate={required()}
                                                fullWidth // Faz o input preencher o Grid item
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextInput
                                                source="contato"
                                                label="Contato"
                                                validate={required()}
                                                fullWidth // Faz o input preencher o Grid item
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextInput
                                                source="link"
                                                label="Link/URL"
                                                validate={required()}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextInput
                                                source="descricao"
                                                label="Descrição"
                                                validate={required()}
                                                fullWidth
                                            />
                                        </Grid>

                                    </Grid>
                                </SimpleFormIterator>
                            </ArrayInput>
                        </FormTab>

                        <FormTab label="Galeria">
                            <ImageInput
                                source="imagens"
                                label="Imagens da ONG"
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
                                    '& .RaFileInput-dropZone': { p: 0 },
                                }}
                            >
                                <ImageField source="src" title="title" />
                            </ImageInput>
                        </FormTab>

                        <FormTab label="Dados bancários">
                            <TextInput source="banco" label="Nome do Banco" validate={required()} />
                            <TextInput source="agencia" label="Agência" validate={required()} />
                            <TextInput source="numero_conta" label="Número da conta" validate={required()} />
                            <SelectInput
                                choices={[
                                    { id: 'corrente', name: 'Conta Corrente' },
                                    { id: 'poupanca', name: 'Conta Poupança' }
                                ]}
                                source="tipo_conta" label="Tipo de Conta" validate={required()} />
                            <TextInput source="chave_pix" label="Chave PIX" validate={required()} />
                        </FormTab>
                    </TabbedForm>
                </Card>
            </Container>
        </EditBase>
    );
};

export default OngEdit;
