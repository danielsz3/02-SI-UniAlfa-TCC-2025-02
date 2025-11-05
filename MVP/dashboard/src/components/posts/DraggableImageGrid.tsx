import { Grid } from '@mui/material';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Dispatch, SetStateAction } from 'react'; // <-- Já inclui a correção de tipo

import { ImageData } from './types';
import { SortableImageItem } from './SortableImageItem';

interface DraggableImageGridProps {
  images: ImageData[];
  setImages: Dispatch<SetStateAction<ImageData[]>>; // <-- Tipo correto
  onRemoveImage: (id: string) => void;
}

export const DraggableImageGrid = ({
  images,
  setImages,
  onRemoveImage,
}: DraggableImageGridProps) => {

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  if (images.length === 0) {
    return null;
  }

  // Função chamada ao soltar o item
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((currentImages) => {
        const oldIndex = currentImages.findIndex((img) => img.id === active.id);
        const newIndex = currentImages.findIndex((img) => img.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return currentImages;
        }

        const newArray = arrayMove(currentImages, oldIndex, newIndex);

        return newArray;
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((img) => img.id)}
        strategy={rectSortingStrategy}
      >
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {images.map((img, index) => (
            <SortableImageItem
              key={img.id}
              image={img}
              onRemove={onRemoveImage}
              index={index}
            />
          ))}
        </Grid>
      </SortableContext>
    </DndContext>
  );
};