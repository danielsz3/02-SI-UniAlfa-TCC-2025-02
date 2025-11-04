import { Paper } from '@mui/material';
import { FilePlaceholder } from '../FilePlaceHolder'; // Você já tinha este

interface ImageDropzoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageDropzone = ({
  isDragging,
  onDragLeave,
  onDragOver,
  onDrop,
  onInputChange,
}: ImageDropzoneProps) => {
  return (
    <Paper
      elevation={0}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      component="label"
      htmlFor="file-input"
      sx={{
        cursor: 'pointer',
        border: isDragging ? '2px dashed primary.main' : '2px dashed grey.400',
        bgcolor: isDragging ? 'primary.light' : 'transparent',
      }}
    >
      <FilePlaceholder
        multiple
        accept={['image/png', 'image/jpeg', 'image/jpg']}
        maxSize={10_500_000}
      />
      <input
        type="file"
        id="file-input"
        multiple
        accept="image/png,image/jpeg,image/jpg"
        onChange={onInputChange}
        style={{ display: 'none' }}
      />
    </Paper>
  );
};