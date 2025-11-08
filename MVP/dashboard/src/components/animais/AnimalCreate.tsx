import { BooleanInput, Button, Create, FormDataConsumer, FormTab, ImageField, ImageInput, RadioButtonGroupInput, required, SaveButton, SelectInput, TabbedForm, TextInput, useNotify, useRedirect } from "react-admin";
import { FilePlaceholder } from "../FilePlaceHolder";
import CustomDatePicker from "../datepicker/customDatePicker";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogActions, DialogTitle } from "@mui/material";
import { CustomToolbar } from "../CustomToolbar";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { urlToFile } from '../../utils/ImgDownloader';

interface Animal {
    id: number;
    nome: string;
    descricao: string;
    ambiente_ideal: string;
    tempo_necessario: string;
    tamanho: string;
    nivel_energia: string;
    data_nascimento: string;
    tipo_animal: string;
    sexo: string;
    castrado: number;
    vale_castracao: number;
    imagens: ImageData[];
}

const AnimalToolbar = () => {
    const redirect = useRedirect();

    const handleBack = () => redirect('list', 'animais');

    return (
        <CustomToolbar
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
                />
            ]}
        />
    );
};

const AnimalCreate = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [animalCriado, setAnimalCriado] = useState<Animal | null>(null);
    const navigate = useNavigate();
    const notify = useNotify();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleSuccess = (data: Animal) => {
        setAnimalCriado(data);
        setShowDialog(true);
        notify('Animal criado com sucesso!');
    };

    const handleConfirmPost = async () => {
        if (!animalCriado || isNavigating) return;

        setIsNavigating(true);

        const createImagePromise = async (imgData: any) => {
            const path = imgData.caminho;
            if (!path) return null;

            const url = `${import.meta.env.VITE_API_URL}/imagens/${path}`;
            const title = imgData.title || path;

            const file = await urlToFile(url, title);

            if (file) {
                return {
                    file: file,
                    title: title,
                };
            }
            return null;
        };

        const promises: Promise<unknown>[] = [];

        if (animalCriado.imagens) {
            animalCriado.imagens.forEach(img => {
                promises.push(createImagePromise(img));
            });
        }

        const resolvedImages = await Promise.all(promises);

        const validImages = resolvedImages.filter(img => !!img);

        const castradoTexto = animalCriado.castrado
            ? '🐾 Já é castrado'
            : animalCriado.vale_castracao
                ? '🎟️ Possui vale castração disponível'
                : '❌ Ainda não é castrado';

        const legenda = `
Venha conhecer ${animalCriado.nome}!

📋 Descrição:
${animalCriado.descricao}

📅 Nascimento: ${animalCriado.data_nascimento ? new Date(animalCriado.data_nascimento).toLocaleDateString('pt-BR') : 'Data não informada'}
⚧ Sexo: ${animalCriado.sexo === 'macho' ? 'Macho' : 'Fêmea'}
🐕 Tipo: ${animalCriado.tipo_animal === 'cao' ? 'Cachorro' : animalCriado.tipo_animal === 'gato' ? 'Gato' : 'Outro'}

💪 Porte: ${animalCriado.tamanho === 'pequeno'
                ? 'Pequeno (até 10kg)'
                : animalCriado.tamanho === 'medio'
                    ? 'Médio (10kg a 25kg)'
                    : 'Grande (acima de 25kg)'}

⚡ Energia: ${animalCriado.nivel_energia === 'baixa'
                ? 'Calmo / Tranquilo'
                : animalCriado.nivel_energia === 'moderada'
                    ? 'Ativo / Brincalhão'
                    : 'Muito Energético'}

🏡 Ambiente Ideal: ${animalCriado.ambiente_ideal === 'area_pequena'
                ? 'Ambiente interno (apartamento)'
                : animalCriado.ambiente_ideal === 'area_media'
                    ? 'Casa com quintal pequeno'
                    : 'Espaço amplo (sítio ou quintal grande)'}

🕐 Necessidade de tempo: ${animalCriado.tempo_necessario === 'pouco_tempo'
                ? 'Independente, se adapta bem sozinho'
                : animalCriado.tempo_necessario === 'tempo_moderado'
                    ? 'Gosta de companhia e passeios diários'
                    : 'Precisa de atenção constante e interação frequente'
            }

${castradoTexto}

💖 Está prontinho para encontrar uma nova família! 
Entre em contato para saber mais e fazer parte dessa história de amor e adoção.
`;

        setShowDialog(false);
        navigate('/posts/create', {
            state: {
                defaultValues: {
                    legenda: legenda.trim(),
                    imagens: validImages,
                },
            },
        });
    };

    const handleCancel = () => {
        setShowDialog(false);
        navigate('/animais');
    };


    return (
        <>
            <Create
                title="Cadastrar Animal"
                sx={{ width: '100%', maxWidth: 600, margin: '0 auto', mb: 10 }}
                redirect="list"
                transform={data => ({
                    ...data,
                    castrado: data.castrado === true ? 1 : 0,
                    vale_castracao: data.vale_castracao === true ? 1 : 0
                })}
                mutationOptions={{ onSuccess: handleSuccess }}
            >
                <TabbedForm
                    toolbar={<AnimalToolbar />}
                >
                    <FormTab label="Informações">

                        <TextInput
                            source="nome"
                            label="Nome"
                            validate={required('O nome é obrigatório')}
                        />

                        <CustomDatePicker
                            source='data_nascimento'
                            label="Data de Nascimento *"
                            validate={required('A data de nascimento é obrigatória')}
                            helperText="Informe a data de nascimento aproximada do animal."
                        />

                        <SelectInput
                            source="tipo_animal"
                            label="Tipo"
                            choices={[
                                { id: 'gato', name: 'Gato' },
                                { id: 'cao', name: 'Cachorro' },
                                { id: 'outro', name: 'Outro' },
                            ]}
                            validate={required('O tamanho é obrigatório')}
                        />

                        <RadioButtonGroupInput
                            label="Sexo"
                            source="sexo"
                            choices={[
                                { id: 'macho', name: 'Macho' },
                                { id: 'femea', name: 'Femêa' }
                            ]}
                            defaultValue={'ativo'}
                            validate={required('A situação é obrigatório')}
                        />

                        <FormDataConsumer>
                            {({ formData, ...rest }) => (
                                <BooleanInput
                                    label="O Animal é castrado?"
                                    source="castrado"
                                    readOnly={formData.vale_castracao === true}
                                    {...rest}
                                />
                            )}
                        </FormDataConsumer>

                        <FormDataConsumer>
                            {({ formData, ...rest }) => {
                                if (formData.castrado && formData.vale_castracao) {
                                    formData.vale_castracao = false; // limpa o valor
                                }
                                return (
                                    <BooleanInput
                                        label="Tem Vale castração?"
                                        source="vale_castracao"
                                        readOnly={formData.castrado === true}
                                        {...rest}
                                    />
                                );
                            }}
                        </FormDataConsumer>

                        <TextInput
                            source="descricao"
                            label="Descrição"
                            multiline
                            rows={3}
                            validate={required('A descrição é obrigatória')}
                        />
                    </FormTab>

                    <FormTab label="Galeria">
                        <ImageInput
                            source="imagens"
                            label="Imagens do Animal"
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

                    <FormTab label="Perfil">
                        <SelectInput
                            source="nivel_energia"
                            label="Nível de Energia"
                            choices={[
                                { id: 'baixa', name: 'Calmo / Tranquilo' },
                                { id: 'moderada', name: 'Ativo / Brincalhão' },
                                { id: 'alta', name: 'Muito Energético' },
                            ]}
                            validate={required('O nível é obrigatório')}
                            optionText={(choice) => (
                                <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>
                                    {choice.name}
                                </span>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                },
                            }}
                        />

                        <SelectInput
                            source="tamanho"
                            label="Tamanho/Porte"
                            choices={[
                                { id: 'pequeno', name: 'Pequeno (até 10kg)' },
                                { id: 'medio', name: 'Médio (10kg a 25kg)' },
                                { id: 'grande', name: 'Grande (acima de 25kg)' },
                            ]}
                            validate={required('O tamanho é obrigatório')}
                            optionText={(choice) => (
                                <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>
                                    {choice.name}
                                </span>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                },
                            }}
                        />

                        <SelectInput
                            source="tempo_necessario"
                            label="Necessidade de tempo e cuidado"
                            choices={[
                                { id: 'pouco_tempo', name: 'Pouco tempo (independente, se adapta bem sozinho)' },
                                { id: 'tempo_moderado', name: 'Tempo moderado (gosta de companhia e passeios diários)' },
                                { id: 'muito_tempo', name: 'Muito tempo (precisa de atenção constante e interação frequente)' },
                            ]}
                            validate={required('O tempo é obrigatório')}
                            optionText={(choice) => (
                                <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>
                                    {choice.name}
                                </span>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                },
                            }}
                        />

                        <SelectInput
                            source="ambiente_ideal"
                            label="Ambiente Ideal"
                            choices={[
                                { id: 'area_pequena', name: 'Área pequena (ambiente interno, como apartamento)' },
                                { id: 'area_media', name: 'Área média (casa com quintal pequeno ou espaço limitado)' },
                                { id: 'area_externa', name: 'Área externa ampla (quintal grande, sítio ou espaço aberto)' },
                            ]}
                            validate={required('O ambiente é obrigatório')}
                            optionText={(choice) => (
                                <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>
                                    {choice.name}
                                </span>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                },
                            }}
                        />

                    </FormTab>
                </TabbedForm>
            </Create>

            <Dialog open={showDialog} onClose={handleCancel}>
                <DialogTitle>
                    Deseja criar um post no Instagram sobre este animal?
                </DialogTitle>
                <DialogActions>
                    <Button onClick={handleCancel} color="secondary">
                        Não
                    </Button>
                    <Button onClick={handleConfirmPost} color="primary" autoFocus>
                        Sim
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default AnimalCreate;