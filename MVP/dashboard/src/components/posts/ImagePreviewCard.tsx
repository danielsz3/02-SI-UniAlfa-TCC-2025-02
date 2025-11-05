import { Box, Card, CardMedia, Chip, Fab, SxProps } from '@mui/material';
import { Close, Delete, DeleteForever } from '@mui/icons-material';
import { ImageData } from './types';
import { IconButtonWithTooltip } from 'react-admin';

interface ImagePreviewCardProps {
  image: ImageData;
  onRemove: (id: string) => void;
  isDragging: boolean;
  dragHandleProps: Record<string, any>; 
}

export const ImagePreviewCard = ({
  image,
  onRemove,
  isDragging,
  dragHandleProps,
}: ImagePreviewCardProps) => {
  const cardStyles: SxProps = {
    position: 'relative',
    height: '100%',
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0px 10px 15px -3px rgba(0,0,0,0.1)' : 'none',
    transition: 'opacity 0.2s, box-shadow 0.2s',
  };

  return (
    <Box {...dragHandleProps} sx={cardStyles}>
      <Card sx={{ height: '100%' }}>
        <CardMedia
          component="img"
          image={image.src}
          alt="Preview"
          sx={{
            width: '100%',
            height: 150, // Defina uma altura fixa ou use aspectRatio
            objectFit: 'cover',
          }}
        />
      </Card>

      <Chip
        label="Imagem"
        size="small"
        sx={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
        }}
      />
      
      {/* Botão de Remover */}
      <IconButtonWithTooltip
        label="Remover"
        size="small"
        color="secondary"
        aria-label="remover"
        onClick={() => onRemove(image.id)}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
        }}
      >
        <Delete fontSize="medium" sx={{ color: 'error.main'}} />
      </IconButtonWithTooltip>
    </Box>
  );
};