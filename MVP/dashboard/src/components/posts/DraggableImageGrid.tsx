import { Grid } from '@mui/material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { ImagePreviewCard } from './ImagePreviewCard';
import { ImageData } from './types';

interface DraggableImageGridProps {
  images: ImageData[];
  onDragEnd: (result: DropResult) => void;
  onRemoveImage: (id: string) => void;
}

export const DraggableImageGrid = ({
  images,
  onDragEnd,
  onRemoveImage,
}: DraggableImageGridProps) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="image-list" direction='horizontal'>
        {(provided) => (
          <Grid
            container
            spacing={2}
            sx={{ mt: 1 }}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {images.map((img, index) => (
              <Draggable key={img.id} draggableId={img.id} index={index}>
                {(provided, snapshot) => (
                  <Grid
                    size={{ xs: 6, sm: 6, md: 4 }}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                      opacity: snapshot.isDragging ? 0.8 : 1,
                      transition: 'opacity 0.2s',
                      zIndex: snapshot.isDragging ? 9999 : 'auto',
                    }}
                  >
                    <ImagePreviewCard
                      image={img}
                      index={index}
                      onRemove={onRemoveImage}
                      isDragging={snapshot.isDragging}
                    />
                  </Grid>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Grid>
        )}
      </Droppable>
    </DragDropContext>
  );
};