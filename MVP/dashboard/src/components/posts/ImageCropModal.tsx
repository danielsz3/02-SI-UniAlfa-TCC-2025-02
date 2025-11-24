import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import Cropper, { Area, Point } from 'react-easy-crop';
import { getCroppedImg } from './utils/imageUtils';
import { ImageData } from './types';

interface ImageCropModalProps {
  image: ImageData | null;
  onSave: (croppedFile: File) => void;
  onSkip: () => void;
}

// Proporções comuns
const ASPECT_RATIOS = [
  { value: 4 / 5, text: 'Retrato (4:5)' },
  { value: 1 / 1, text: 'Quadrado (1:1)' },
  { value: 1.91 / 1, text: 'Paisagem (1.91:1)' },
];

export const ImageCropModal = ({
  image,
  onSave,
  onSkip,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1); // Começa com 1:1 por padrão
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels || !image) return;

    try {
      const croppedFile = await getCroppedImg(
        image.src,
        croppedAreaPixels,
        image.file.name
      );
      onSave(croppedFile);
    } catch (e) {
      console.error('Erro ao cortar imagem:', e);
      onSkip(); // Pula se der erro
    }
  };

  const handleAspectChange = (
    event: React.MouseEvent<HTMLElement>,
    newAspect: number
  ) => {
    if (newAspect !== null) {
      setAspect(newAspect);
    }
  };

  return (
    <Dialog open={!!image} onClose={onSkip} maxWidth="sm" fullWidth>
      <DialogTitle>Ajustar Imagem para o Feed</DialogTitle>
      <DialogContent sx={{ position: 'relative', height: 800 }}>
        {image && (
          <Cropper
            style={{ containerStyle: { backgroundColor: "#184d5cff" } }}
            image={image.src}
            crop={crop}
            zoom={zoom}
            aspect={aspect} // <-- Esta prop agora será obedecida
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            minZoom={1}
            maxZoom={3}
            restrictPosition={true}
          // A prop 'cropSize' foi removida daqui
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 2 }}>
        <Box sx={{ width: '90%' }}>
          <Typography gutterBottom>Zoom</Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, newValue) => setZoom(newValue as number)}
          />
        </Box>
        <Box>
          <Typography gutterBottom>Proporção</Typography>
          <ToggleButtonGroup
            value={aspect}
            exclusive
            onChange={handleAspectChange}
            size="small"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <ToggleButton key={ratio.value} value={ratio.value}>
                {ratio.text}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: 1 }}
        >
          <Button onClick={onSkip} color="inherit">
            Pular
          </Button>
          <Button onClick={handleSaveCrop} variant="contained">
            Salvar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};