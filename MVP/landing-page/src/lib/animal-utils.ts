// lib/animal-utils.ts
import { AgeRangeKey } from "@/types"

/** Calcula a idade formatada (anos/meses) a partir da data de nascimento */
export function calcularIdade(data?: string): string {
  if (!data) return "Idade desconhecida"
  const inicio = new Date(data)
  const agora = new Date()

  // Calcula diferença inicial em anos, meses e dias
  let anos = agora.getFullYear() - inicio.getFullYear()
  let meses = agora.getMonth() - inicio.getMonth()
  let dias = agora.getDate() - inicio.getDate()

  // Ajusta meses/dias negativos
  if (dias < 0) {
    meses -= 1
    const ultimoDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate()
    dias += ultimoDiaMesAnterior
  }

  if (meses < 0) {
    anos -= 1
    meses += 12
  }

  // Monta string final com pluralização
  const partes: string[] = []

  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`)
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`)
  if (dias > 0 || partes.length === 0)
    partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`)

  // Junta partes com vírgulas e "e" no final
  if (partes.length > 1) {
    const ultimo = partes.pop()
    return partes.join(', ') + ' e ' + ultimo
  }
  return partes[0]
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