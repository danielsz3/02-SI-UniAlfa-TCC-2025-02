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
  imagens: Imagens[]
  // Campos dos detalhes (opcionais)
  descricao?: string
  castrado?: boolean
  ambiente_ideal?: string
  tempo_necessario?: string
  situacao?: string
  fica_usuario?: number
  id_lar_temporario?: number
  lar_temporario?: LarTemporario
  vale_castracao?: boolean
}

export interface LarTemporario {
  id: number
  nome: string
}

export interface Imagens {
  id: number
  caminho: string
}

export interface AnimalAffinity {
  afinidade: number
  afinidade_percent: number
  animal: Animal
}

export type AgeRangeKey = "any" | "0_1" | "1_3" | "3_8" | "8_plus"