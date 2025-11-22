import { BooleanInput, Button, DeleteWithConfirmButton, Edit, FormTab, ImageField, ImageInput, RadioButtonGroupInput, ReferenceInput, required, SaveButton, SelectInput, TabbedForm, TextInput, useNotify, useRecordContext, useRedirect } from "react-admin";
import { FilePlaceholder } from "../FilePlaceHolder";
import CustomDatePicker from "../datepicker/customDatePicker";
import { useFormContext } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { CustomToolbar } from "../CustomToolbar";
import { Dialog, DialogActions, DialogTitle } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { urlToFile } from '../../utils/ImgDownloader';

interface Animal {
    id: number;
    nome: string;
    descricao: string;
    ambiente_ideal: string;
    tempo_necessario: string;
    tamanho: string;
    situacao: string;
    nivel_energia: string;
    data_nascimento: string;
    tipo_animal: string;
    sexo: string;
    castrado: number;
    vale_castracao: number;
    imagens: ImageData[];
}

const CastracaoInputs = () => {
    const { watch, setValue } = useFormContext();
    const record = useRecordContext();

    const castrado = watch("castrado");
    const vale_castracao = watch("vale_castracao");

    useEffect(() => {
        if (record) {
            setValue("castrado", !!record.castrado);
            setValue("vale_castracao", !!record.vale_castracao);
        }
    }, [record, setValue]);

    useEffect(() => {
        if (castrado && vale_castracao) {
            setValue("vale_castracao", false);
        }
    }, [castrado, vale_castracao, setValue]);

    return (
        <>
            <BooleanInput
                label="O Animal é castrado?"
                source="castrado"
                readOnly={vale_castracao === true || vale_castracao == 1}
            />

            <BooleanInput
                label="Tem Vale castração?"
                source="vale_castracao"
                readOnly={castrado === true || castrado == 1}
            />
        </>
    );
};

const StatusInput = () => {
    const record = useRecordContext();
    if (!record || record.situacao !== 'em_aprovacao') {
        return null;
    }
    return (
        <SelectInput
            source="situacao"
            label="Situação"
            choices={[
                { id: 'em_aprovacao', name: 'Anúnciado' },
                { id: 'disponivel', name: 'Disponível para Adoção' },
            ]}
            validate={required('O status é obrigatório')}
            defaultValue="em_aprovacao"
        />
    );
};

const LarTempInput = () => {
    const record = useRecordContext();
    const ficaUsuario = record?.fica_usuario == 1;

    if (ficaUsuario) {
        const helperText = 'O animal fica com o usuário criador do animal. Não é possivel atribuir um lar temporário.';
        return (
            <TextInput
                source="lar_temporario_id"
                label="Lar Temporário"
                helperText={helperText}
                disabled
            />
        );
    }

    return (
        <ReferenceInput
            source="lar_temporario_id"
            reference="lares-temporarios"
        >
            <SelectInput
                validate={required('O lar temporário é obrigatório')}
                optionValue="id"
                optionText="nome"
                label="Lar Temporário"
                helperText="Selecione um lar temporário para o animal."
            />
        </ReferenceInput>
    );
}

const AnimalToolbar = () => {
    const redirect = useRedirect();

    const handleBack = () => redirect('list', 'animais');

    return (
        <CustomToolbar
            leftButtons={[
                <SaveButton
                    type='button'
                />,
            ]}
            rightButtons={[
                <Button
                    label="Voltar"
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={handleBack}
                />,
                <DeleteWithConfirmButton
                    confirmTitle="Tem certeza?"
                    confirmContent="Deseja realmente excluir o animal?"
                />,
            ]}
        />
    );
};

const validaAnunciado = () => {
    const record = useRecordContext()

    if (record?.situacao === 'em_aprovacao') {
        return true
    }
}

const AnimalEdit = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [animalAlterado, setAnimalAlterado] = useState<Animal | null>(null);
    const navigate = useNavigate();
    const notify = useNotify();
    const [isNavigating, setIsNavigating] = useState(false);

    const shouldOpenPostDialog = useRef(false);
    const submittedData = useRef<Animal | null>(null);

    const handleSuccess = () => {

        if (submittedData.current) {
            setAnimalAlterado(submittedData.current);
        }

        notify('Animal alterado com sucesso!');

        if (shouldOpenPostDialog.current) {
            setShowDialog(true);
        }
    };

    const handleConfirmPost = async () => {
        if (!animalAlterado || isNavigating) return;

        setIsNavigating(true);

        const createImagePromise = async (imgData: any) => {
            if (imgData.rawFile instanceof File) {
                return {
                    file: imgData.rawFile,
                    title: imgData.title || 'nova_imagem.jpg'
                };
            }

            let path = imgData.caminho || imgData.src;

            if (!path) {
                console.warn("Imagem ignorada (sem caminho ou src):", imgData);
                return null;
            }

            let url = path;
            if (!path.startsWith('http') && !path.startsWith('blob:')) {
                url = `${import.meta.env.VITE_API_URL}/imagens/${path}`;
            }

            const title = imgData.title || path;

            try {
                const file = await urlToFile(url, title);
                if (file) {
                    return {
                        file: file,
                        title: title,
                    };
                }
            } catch (error) {
                console.error("Erro ao processar imagem:", url, error);
            }
            return null;
        };

        const promises: Promise<unknown>[] = [];

        if (animalAlterado.imagens && Array.isArray(animalAlterado.imagens)) {
            animalAlterado.imagens.forEach(img => {
                promises.push(createImagePromise(img));
            });
        }

        const resolvedImages = await Promise.all(promises);
        const validImages = resolvedImages.filter(img => !!img);

        // --- Montagem da Legenda (Mantive igual) ---
        const castradoTexto = animalAlterado.castrado
            ? '🐾 Já é castrado'
            : animalAlterado.vale_castracao
                ? '🎟️ Possui vale castração disponível'
                : '❌ Ainda não é castrado';

        const legenda = `
    Venha conhecer ${animalAlterado.nome}!
    
    📋 Descrição:
    ${animalAlterado.descricao}
    
    📅 Nascimento aproximado: ${animalAlterado.data_nascimento ? new Date(animalAlterado.data_nascimento).toLocaleDateString('pt-BR') : 'Data não informada'}
    ⚧ Sexo: ${animalAlterado.sexo === 'macho' ? 'Macho' : 'Fêmea'}
    🐕 Tipo: ${animalAlterado.tipo_animal === 'cao' ? 'Cachorro' : animalAlterado.tipo_animal === 'gato' ? 'Gato' : 'Outro'}
    
    💪 Porte: ${animalAlterado.tamanho === 'pequeno'
                ? 'Pequeno (até 10kg)'
                : animalAlterado.tamanho === 'medio'
                    ? 'Médio (10kg a 25kg)'
                    : 'Grande (acima de 25kg)'}
    
    ⚡ Energia: ${animalAlterado.nivel_energia === 'baixa'
                ? 'Calmo / Tranquilo'
                : animalAlterado.nivel_energia === 'moderada'
                    ? 'Ativo / Brincalhão'
                    : 'Muito Energético'}
    
    🏡 Ambiente Ideal: ${animalAlterado.ambiente_ideal === 'area_pequena'
                ? 'Ambiente interno (apartamento)'
                : animalAlterado.ambiente_ideal === 'area_media'
                    ? 'Casa com quintal pequeno'
                    : 'Espaço amplo (sítio ou quintal grande)'}
    
    🕐 Necessidade de tempo: ${animalAlterado.tempo_necessario === 'pouco_tempo'
                ? 'Independente, se adapta bem sozinho'
                : animalAlterado.tempo_necessario === 'tempo_moderado'
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
        setIsNavigating(false); // Reseta o estado para permitir novas tentativas se necessário
    };

    const handleCancel = () => {
        setShowDialog(false);
        navigate('/animais');
    };


    return (
        <>
            <Edit
                title="Editar Animal"
                sx={{ width: '100%', maxWidth: 600, margin: '0 auto', mb: 10 }}
                redirect="list"
                transform={(data, context: any) => {
                    const previousData = context?.previousData || {};

                    if (previousData.situacao === 'em_aprovacao' && data.situacao === 'disponivel') {
                        shouldOpenPostDialog.current = true;
                    } else {
                        shouldOpenPostDialog.current = false;
                    }

                    submittedData.current = {
                        ...previousData,
                        ...data,
                        imagens: data.imagens || previousData.imagens
                    };

                    return {
                        ...data,
                        castrado: !!data.castrado ? 1 : 0,
                        vale_castracao: !!data.vale_castracao ? 1 : 0
                    }
                }}
                mutationMode="pessimistic"
                mutationOptions={{ onSuccess: handleSuccess }}
            >
                <TabbedForm
                    toolbar={<AnimalToolbar />}
                >
                    <FormTab label="Informações">

                        <LarTempInput />

                        <StatusInput />

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
                            validate={required('O tipo é obrigatório')}
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

                        <CastracaoInputs />

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
                            accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', 'webp'] }}
                            maxSize={10_500_000}
                            validate={required('Pelo menos uma imagem é obrigatória')}
                            placeholder={
                                <FilePlaceholder
                                    maxSize={10_500_000}
                                    accept={['.png', '.jpg', '.jpeg', '.gif', 'webp']}
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
            </Edit >
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

export default AnimalEdit;