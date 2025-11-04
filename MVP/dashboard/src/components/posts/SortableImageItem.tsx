import { Grid } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePreviewCard } from './ImagePreviewCard';
import { ImageData } from './types';

interface SortableImageItemProps {
  image: ImageData;
  onRemove: (id: string) => void;
}

export const SortableImageItem = ({ image, onRemove }: SortableImageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  // Estilo para mover o item (transform) e animar (transition)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    // O Grid item agora é responsivo como você queria
    <Grid
      size={{ xs: 6, sm: 4, md: 4 }}
      ref={setNodeRef} // Referência para o dnd-kit
      style={style} // Estilos de transformação
    >
      <ImagePreviewCard
        image={image}
        onRemove={onRemove}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </Grid>
  );
};