import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Typography,
    Button,
    Paper,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { DropResult } from '@hello-pangea/dnd';
import { CreateBase, Title, useNotify, useCreate } from 'react-admin';
import { ImageData } from './types';
import { validateAndLoadImage, isValidFeedAspect } from './utils/imageUtils';
import { ImageCropModal } from './ImageCropModal';
import { ImageDropzone } from './ImageDropzone';
import { DraggableImageGrid } from './DraggableImageGrid';

type DefaultValues = {
    legenda?: string;
    imagens?: ImageData[];
} | null;

const PostCreate = () => {
    const [legenda, setLegenda] = useState('');
    const [create] = useCreate();
    const [imagens, setImagens] = useState<ImageData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingCrop, setPendingCrop] = useState<ImageData[]>([]);
    const [currentCrop, setCurrentCrop] = useState<ImageData | null>(null);
    const [invalidHelper, setInvalidHelper] = useState<string | null>(null);

    const location = useLocation();
    const notify = useNotify();

    const [initialDefaultValues] = useState<DefaultValues>(
        () => location.state?.defaultValues || null
    );
    const [hasProcessedDefaults, setHasProcessedDefaults] = useState(false);

    useEffect(() => {

        if (!initialDefaultValues || hasProcessedDefaults) {
            return;
        }

        setHasProcessedDefaults(true);

        const defaults = initialDefaultValues;

        setLegenda(defaults.legenda || '');

        if (defaults.imagens && defaults.imagens.length > 0) {

            const defaultsArray = defaults.imagens;

            const processDefaultImages = async () => {
                setLoading(true);
                const newValidImages: ImageData[] = [];
                const newImagesToCrop: ImageData[] = [];

                for (const img of defaultsArray) {
                    const { file, src, width, height, title } = img;

                    if (file instanceof File) {
                        try {
                            const imageData = await validateAndLoadImage(file);
                            if (imageData.isValid) {
                                newValidImages.push(imageData);
                            } else {
                                newImagesToCrop.push(imageData);
                            }
                        } catch (error) {
                            console.error('Erro ao carregar imagem padrão (File):', error);
                        }
                    }

                    else if (src && width && height) {
                        if (isValidFeedAspect(width, height)) {
                            newValidImages.push({
                                id: `img-${Date.now()}-${Math.random()}`,
                                file: new File([], title || 'image.png', { type: 'image/png' }),
                                src,
                                width,
                                height,
                                isValid: true,
                                title: title || 'Imagem Padrão',
                            });
                        } else {
                            // Descarta silenciosamente
                        }
                    }
                }

                // Atualiza os estados
                setImagens(newValidImages);
                if (newImagesToCrop.length > 0) {
                    setPendingCrop(newImagesToCrop);
                    setCurrentCrop(newImagesToCrop[0]);
                }
                setLoading(false);
            };

            processDefaultImages();
        }
    }, [initialDefaultValues, hasProcessedDefaults]);

    const handleFileSelect = async (files: FileList) => {
        setLoading(true);
        setInvalidHelper(null);
        const fileArray = Array.from(files);

        const newValidImages: ImageData[] = [];
        const newImagesToCrop: ImageData[] = [];
        let ignoredCount = 0;

        for (const file of fileArray) {
            if (file.size > 10_500_000 || !file.type.startsWith('image/')) {
                ignoredCount++;
                continue;
            }

            try {
                const imageData = await validateAndLoadImage(file);
                if (imageData.isValid) {
                    newValidImages.push(imageData);
                } else {
                    // Em vez de rejeitar, adiciona à fila de corte
                    newImagesToCrop.push(imageData);
                }
            } catch (err) {
                console.warn('Erro ao validar imagem:', err);
                ignoredCount++;
            }
        }

        if (newValidImages.length > 0) {
            setImagens((prev) => [...prev, ...newValidImages]);
        }

        if (newImagesToCrop.length > 0) {
            const totalPending = [...pendingCrop, ...newImagesToCrop];
            setPendingCrop(totalPending);

            if (!currentCrop) {
                setCurrentCrop(totalPending[0]);
            }
        }

        if (ignoredCount > 0) {
            setInvalidHelper(
                `${ignoredCount} arquivo(s) foram ignorados por tipo ou tamanho inválido.`
            );
        }

        setLoading(false);
    };

    const handleNextCrop = () => {
        // Esta lógica está correta
        const [, ...remaining] = pendingCrop; // Pega todos, menos o primeiro
        setPendingCrop(remaining);
        setCurrentCrop(remaining[0] || null); // Define o próximo ou fecha o modal
    };

    /**
     * Chamado quando o usuário salva uma imagem cortada.
     */
    const handleCropSave = async (croppedFile: File) => {
        setLoading(true);
        try {
            // Re-valida a imagem cortada e a adiciona
            const newImageData = await validateAndLoadImage(croppedFile);
            setImagens((prev) => [...prev, newImageData]);
            handleNextCrop(); // Move para a próxima
        } catch (error) {
            console.error('Erro ao salvar imagem cortada', error);
            notify('Erro ao salvar imagem cortada', { type: 'error' });
            handleNextCrop(); // Pula para a próxima mesmo se der erro
        }
        setLoading(false);
    };

    const handleCropSkip = () => {
        notify('Imagem ignorada', { type: 'info' });
        handleNextCrop(); // Apenas move para a próxima
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
        }
    };

    const removeImage = (id: string) => {
        setImagens(imagens.filter((img) => img.id !== id));
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(imagens);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setImagens(items);
    };

    // --- Submissão ---
    const handleSubmit = () => {
        if (legenda.trim() === '') {
            notify('A legenda é obrigatória', { type: 'warning' });
            return;
        }

        if (imagens.length === 0) {
            notify('Pelo menos uma imagem é obrigatória', { type: 'warning' });
            return;
        }

        const filesToUpload = imagens.map((img) => {

            const file = new File([img.file], img.title, { type: img.file.type });

            return {
                rawFile: file,
                title: img.title,
            };
        });

        const postData = {
            legenda: legenda,
            imagens: filesToUpload,
        };

        create(
            'posts',
            { data: postData },
            {
                onSuccess: () => {
                    notify('Post criado com sucesso!', { type: 'success' });
                    handleClear();
                },
                onError: () => {
                    notify('Erro ao criar post', { type: 'error' });
                },
            }
        );
    };

    const handleClear = () => {
        setLegenda('');
        setImagens([]);
        setInvalidHelper(null);
        setPendingCrop([]);
        setCurrentCrop(null);
    };

    const isSubmitting = loading || !!currentCrop;

    return (
        <CreateBase resource="posts">
            <Title title="Criar Post" />
            <Box sx={{ py: 4, px: 2 }}>
                <Paper
                    elevation={2}
                    sx={{ maxWidth: 600, mx: 'auto', p: 3, mb: 10 }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Legenda"
                            multiline
                            minRows={3}
                            maxRows={6}
                            fullWidth
                            value={legenda}
                            onChange={(e) => setLegenda(e.target.value)}
                            placeholder="Digite a legenda do post..."
                            variant="outlined"
                            required
                        />

                        <Box>
                            <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                Imagens do Post *
                            </Typography>

                            <ImageDropzone
                                isDragging={isDragging}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onInputChange={handleInputChange}
                            />

                            <Box sx={{ mt: 1 }}>
                                {invalidHelper && (
                                    <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                                        {invalidHelper}
                                    </Alert>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    Imagens fora da proporção serão enviadas para ajuste.
                                </Typography>
                            </Box>

                            {(loading || !!currentCrop) && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        mt: 3,
                                    }}
                                >
                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {loading
                                            ? 'Processando...'
                                            : 'Aguardando ajuste de imagem...'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <DraggableImageGrid
                            images={imagens}
                            onDragEnd={onDragEnd}
                            onRemoveImage={removeImage}
                        />

                        {imagens.length > 1 && (
                            <Typography
                                variant="caption"
                                fontWeight="medium"
                                sx={{ textAlign: 'center' }}
                            >
                                Arraste para mudar a ordem das imagens
                            </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={isSubmitting || imagens.length === 0}
                                size="large"
                            >
                                Criar Post
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleClear}
                                startIcon={<Clear />}
                                size="large"
                                disabled={isSubmitting}
                            >
                                Limpar
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <ImageCropModal
                image={currentCrop}
                onSave={handleCropSave}
                onSkip={handleCropSkip}
            />
        </CreateBase>
    );
};

export default PostCreate;