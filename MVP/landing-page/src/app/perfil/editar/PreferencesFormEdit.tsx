"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import RadioCardGroup from "@/components/forms/inputs/RadioCardGroup"
import { FormData } from "./page"

interface PreferencesFormEditProps {
  defaultValues: FormData
  onNext: (data: Partial<FormData>) => void
  onBack?: () => void
}

export default function PreferencesFormEdit({ defaultValues, onNext, onBack }: PreferencesFormEditProps) {
  const [form, setForm] = useState<Partial<FormData>>(defaultValues)

  const updateField = (name: keyof FormData, value: any) => setForm(prev => ({ ...prev, [name]: value }))

  return (
    <div className="space-y-6 w-full">
      <h3 className="text-base font-semibold mb-2">Tamanho do pet</h3>
      <RadioCardGroup
        name="tamanho_pet"
        value={form.tamanho_pet ?? ""}
        onValueChange={(v) => updateField("tamanho_pet", v)}
        options={[
          { id: "t-peq", value: "pequeno", title: "Pequeno", description: "Até 10kg" },
          { id: "t-med", value: "medio", title: "Médio", description: "10-25kg" },
          { id: "t-gra", value: "grande", title: "Grande", description: "Acima de 25kg" },
        ]}
        columns={3}
      />

      <h3 className="text-base font-semibold mb-2">Tempo disponível</h3>
      <RadioCardGroup
        name="tempo_disponivel"
        value={form.tempo_disponivel ?? ""}
        onValueChange={(v) => updateField("tempo_disponivel", v)}
        options={[
          { id: "tm-1", value: "pouco_tempo", title: "Pouco", description: "Rotina corrida" },
          { id: "tm-2", value: "tempo_moderado", title: "Moderado", description: "Algumas horas por dia" },
          { id: "tm-3", value: "muito_tempo", title: "Muito", description: "Tempo disponível" },
        ]}
        columns={3}
      />

      <h3 className="text-base font-semibold mb-2">Estilo de vida</h3>
      <RadioCardGroup
        name="estilo_vida"
        value={form.estilo_vida ?? ""}
        onValueChange={(v) => updateField("estilo_vida", v)}
        options={[
          { id: "ev-1", value: "baixa", title: "Baixa", description: "Tranquilo" },
          { id: "ev-2", value: "moderada", title: "Moderada", description: "Equilibrado" },
          { id: "ev-3", value: "alta", title: "Alta", description: "Muito ativo" },
        ]}
        columns={3}
      />

      <h3 className="text-base font-semibold mb-2">Espaço da casa</h3>
      <RadioCardGroup
        name="espaco_casa"
        value={form.espaco_casa ?? ""}
        onValueChange={(v) => updateField("espaco_casa", v)}
        options={[
          { id: "es-1", value: "area_pequena", title: "Pequeno", description: "Apartamento" },
          { id: "es-2", value: "area_media", title: "Área interna", description: "Casa espaçosa" },
          { id: "es-3", value: "area_externa", title: "Área externa", description: "Quintal/jardim" },
        ]}
        columns={3}
      />

      <div className="flex gap-3">
        {onBack && <Button variant="outline" onClick={onBack} className="w-1/2">Voltar</Button>}
        <Button onClick={() => onNext(form)} className="w-1/2">Salvar</Button>
      </div>
    </div>
  )
}
