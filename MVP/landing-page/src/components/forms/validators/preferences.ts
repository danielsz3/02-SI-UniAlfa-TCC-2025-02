// components/forms/validators/preferences.ts
export function validatePreferences(form: any) {
  const e: Record<string, string> = {}
  if (!["pequeno", "medio", "grande"].includes((form.tamanhoPet || "").toLowerCase()))
    e.tamanhoPet = "Selecione o tamanho do pet."
  if (!["pouco_tempo", "tempo_moderado", "muito_tempo"].includes((form.tempoCuidar || "").toLowerCase()))
    e.tempoCuidar = "Selecione o tempo disponível."
  if (!["baixa", "moderada", "alta"].includes((form.estiloVida || "").toLowerCase()))
    e.estiloVida = "Selecione o estilo de vida."
  if (!["area_pequena", "area_media", "area_externa"].includes((form.espaco || "").toLowerCase()))
    e.espaco = "Selecione o espaço da casa."
  return e
}
