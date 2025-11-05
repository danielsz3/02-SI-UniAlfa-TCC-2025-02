import { Box, Card, CardMedia, Chip, SxProps } from '@mui/material';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import { ImageData } from './types';
import { IconButtonWithTooltip } from 'react-admin';

interface ImagePreviewCardProps {
  image: ImageData;
  onRemove: (id: string) => void;
  isDragging: boolean;
  dragHandleProps: Record<string, any>;
  index: number;
}

export const ImagePreviewCard = ({
  image,
  onRemove,
  isDragging,
  dragHandleProps,
  index,
}: ImagePreviewCardProps) => {
  const cardStyles: SxProps = {
    position: 'relative',
    height: '100%',
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0px 10px 15px -3px rgba(0,0,0,0.1)' : 'none',
    transition: 'opacity 0.2s, box-shadow 0.2s',
    '&:hover .remove-button-hover': {
      opacity: 1,
      visibility: 'visible',
    },
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
            height: 150,
            objectFit: 'cover',
          }}
        />
      </Card>

      <Chip
        label={index == 0 ? 'Capa' : `# ${index + 1}`}
        size="small"
        color={index == 0 ? 'primary' : 'default'}
        sx={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          zIndex: 1,
          ...(index != 0 && {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
          }),
        }}
      />

      <Box
        className="remove-button-hover"
        onMouseDown={(e) => {
          e.stopPropagation(); 
          onRemove(image.id); 
        }}
        onTouchStart={(e) => {
          e.stopPropagation(); 
          onRemove(image.id); 
        }}
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 2,
          opacity: 0,
          visibility: 'hidden',
          transition: 'opacity 0.2s, visibility 0.2s',
          padding: '2px', 
        }}
      >
        <IconButtonWithTooltip
          label="Remover"
          size="small"
          color="secondary"
          aria-label="remover"
        >
          <RemoveCircleOutlinedIcon
            fontSize="medium"
            sx={{ color: 'error.main' }}
          />
        </IconButtonWithTooltip>
      </Box>
    </Box>
  );
};