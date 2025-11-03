import { Card, CardMedia, IconButton, Chip } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { ImageData } from './types';

interface ImagePreviewCardProps {
  image: ImageData;
  index: number;
  onRemove: (id: string) => void;
  isDragging?: boolean;
}

export const ImagePreviewCard = ({
  image,
  index,
  onRemove,
  isDragging = false,
}: ImagePreviewCardProps) => {
  return (
    <Card
      sx={{
        position: 'relative',
        border: isDragging ? '2px solid primary.main' : '0px solid transparent',
        boxShadow: isDragging ? 6 : 1,
        '&:hover .delete-button': {
          opacity: 1,
        },
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={image.src}
        alt={image.title}
        sx={{ objectFit: 'cover' }}
      />
      <IconButton
        className="delete-button"
        onClick={() => onRemove(image.id)}
        sx={{
          position: 'absolute',
          top: 5,
          right: 5,
          bgcolor: 'rgba(255, 0, 0, 0.7)',
          color: 'white',
          opacity: 0,
          transition: 'opacity 0.3s',
          '&:hover': {
            bgcolor: 'error.dark',
          },
        }}
        size="small"
      >
        <Delete fontSize="small" />
      </IconButton>
      <Chip
        label={index === 0 ? 'Capa' : `Imagem ${index + 1}`}
        color="primary"
        size="small"
        sx={{
          position: 'absolute',
          top: 5,
          left: 5,
          fontSize: '0.7rem',
          fontWeight: 'bold',
        }}
      />
    </Card>
  );
};