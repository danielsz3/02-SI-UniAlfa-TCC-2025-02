// Define a estrutura de uma única imagem
export interface AnimalImage {
  id: string | number;
  url: string;
}

// Define a estrutura do animal principal
export interface Animal {
  id: string | number;
  nome: string;
  images: AnimalImage[]; // Um array de imagens
  // Adicione outros campos do animal aqui (ex: raca, idade...)
}