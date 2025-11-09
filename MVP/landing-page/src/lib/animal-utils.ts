// lib/animal-utils.ts
import { AgeRangeKey } from "@/types"

/** Calcula a idade formatada (anos/meses) a partir da data de nascimento */
export function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return "Idade desconhecida"
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let anos = hoje.getFullYear() - nascimento.getFullYear()
  let meses = hoje.getMonth() - nascimento.getMonth()

  if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
    anos--
    meses = 12 + meses
  }

  if (anos === 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`
  return `${anos} ${anos === 1 ? "ano" : "anos"}`
}

/** Converte chave de faixa etária em intervalo de nascimento (YYYY-MM-DD) */
export function ageRangeToBirthdateRange(key: AgeRangeKey) {
  const hoje = new Date()
  const isoDate = (d: Date) => d.toISOString().split("T")[0]
  switch (key) {
    case "0_1": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 1)
      return { from: isoDate(from), to: isoDate(hoje) }
    }
    case "1_3": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 3)
      const to = new Date(hoje); to.setFullYear(to.getFullYear() - 1)
      return { from: isoDate(from), to: isoDate(to) }
    }
    case "3_8": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 8)
      const to = new Date(hoje); to.setFullYear(to.getFullYear() - 3)
      return { from: isoDate(from), to: isoDate(to) }
    }
    case "8_plus": {
      const from = new Date(hoje); from.setFullYear(from.getFullYear() - 100)
      const to = new Date(hoje); to.setFullYear(to.getFullYear() - 8)
      return { from: isoDate(from), to: isoDate(to) }
    }
    default:
      return {}
  }
}