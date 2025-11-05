import { Area } from 'react-easy-crop';
import { ImageData } from '../types';

// Suas constantes de proporção
export const FEED_MIN = 4 / 5; // 0.8
export const FEED_MAX = 1.91; // 1.91
export const EPSILON = 0.01;

/**
 * Verifica se a proporção da imagem é válida para o feed.
 */
export const isValidFeedAspect = (width: number, height: number) => {
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio >= FEED_MIN - EPSILON && ratio <= FEED_MAX + EPSILON;
};

/**
 * Carrega um arquivo de imagem, lê suas dimensões e valida a proporção.
 */
export const validateAndLoadImage = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const isValid = isValidFeedAspect(img.width, img.height);
        resolve({
          id: `img-${Date.now()}-${Math.random()}`,
          file,
          src: e.target?.result as string,
          width: img.width,
          height: img.height,
          isValid,
          title: file.name,
        });
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Utilitário para criar um novo arquivo de imagem a partir da área cortada no canvas.
 * (Esta é uma função auxiliar padrão para 'react-easy-crop')
 */
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: Area,
  fileName: string
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Não foi possível obter o contexto 2D do canvas'));
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Desenha a imagem cortada no canvas
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Converte o canvas para Blob e depois para File
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Erro ao criar o blob da imagem'));
          }
          const newFile = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(newFile);
        },
        'image/jpeg',
        0.95 // Qualidade 95%
      );
    };
    image.onerror = (error) => reject(error);
  });
};