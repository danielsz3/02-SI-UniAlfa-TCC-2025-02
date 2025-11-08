// types/animal.ts
export interface Animal {
  id: number
  nome: string
  sexo: string
  tipo_animal: string
  created_at: string
  // Campos da lista
  tamanho?: string
  nivel_energia?: string
  data_nascimento?: string
  imagens?: Array<{ caminho: string, id: number }>
  // Campos dos detalhes (opcionais)
  descricao?: string
  castrado?: boolean
}

export type AgeRangeKey = "any" | "0_1" | "1_3" | "3_8" | "8_plus"