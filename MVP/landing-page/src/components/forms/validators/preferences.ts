// components/forms/validators/preferences.ts
export function validatePreferences(form: any) {
  const e: Record<string, string> = {}
  if (!["pequeno", "medio", "grande"].includes((form.tamanhoPet || "").toLowerCase()))
    e.tamanhoPet = "Selecione o tamanho do pet."
  if (!["pouco", "moderado", "muito"].includes((form.tempoCuidar || "").toLowerCase()))
    e.tempoCuidar = "Selecione o tempo disponível."
  if (!["tranquila", "equilibrado", "acao"].includes((form.estiloVida || "").toLowerCase()))
    e.estiloVida = "Selecione o estilo de vida."
  if (!["pequeno", "area_interna", "quintal"].includes((form.espaco || "").toLowerCase()))
    e.espaco = "Selecione o espaço da casa."
  return e
}
