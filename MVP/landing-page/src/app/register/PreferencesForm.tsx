"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import RadioCardGroup from "@/components/forms/inputs/RadioCardGroup"
import { validatePreferences } from "@/components/forms/validators/preferences"

export default function PreferencesForm({ onNext, onBack, defaultValues = {} }: any) {
  const [form, setForm] = useState({
    tamanhoPet: defaultValues.tamanhoPet || "",
    tempoCuidar: defaultValues.tempoCuidar || "",
    estiloVida: defaultValues.estiloVida || "",
    espaco: defaultValues.espaco || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const eobj = validatePreferences(form)
    setErrors(eobj)
    if (Object.keys(eobj).length) return
    onNext(form)
  }

  const legendClass = "text-sm text-muted-foreground mb-3"

  return (
    <form className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 mt-6 md:mt-10" onSubmit={submit}>
      <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6 md:mb-8">
        Preferências
      </h2>

      <div className="space-y-8">
        <div>
          <Label className="text-base font-semibold block mb-1">
            1. Que tamanho de pet você prefere?
          </Label>
          <p className={legendClass}>Considere o espaço da sua casa e sua preferência pessoal.</p>
          <RadioCardGroup
            name="tamanhoPet"
            value={form.tamanhoPet}
            onValueChange={(v) => setForm({ ...form, tamanhoPet: v })}
            options={[
              { value: "pequeno", id: "tamanho-pequeno", title: "Pequeno", description: "Pets que cabem no colo, fáceis de carregar (até 10kg)." },
              { value: "medio", id: "tamanho-medio", title: "Médio", description: "Pets nem muito grandes nem muito pequenos (10-25kg)." },
              { value: "grande", id: "tamanho-grande", title: "Grande", description: "Pets grandes que precisam de mais espaço (acima de 25kg)." },
            ]}
            columns={3}
          />
          {errors.tamanhoPet && <span className="text-red-500 text-xs mt-2 block">{errors.tamanhoPet}</span>}
        </div>

        <div>
          <Label className="text-base font-semibold block mb-1">
            2. Quanto tempo você tem disponível para cuidar do seu pet?
          </Label>
          <p className={legendClass}>Seja honesto sobre sua rotina e disponibilidade diária.</p>
          <RadioCardGroup
            name="tempoCuidar"
            value={form.tempoCuidar}
            onValueChange={(v) => setForm({ ...form, tempoCuidar: v })}
            options={[
              { value: "pouco", id: "tempo-pouco", title: "Pouco", description: "Prefiro pets mais independentes que não precisem de atenção." },
              { value: "moderado", id: "tempo-moderado", title: "Moderado", description: "Posso dedicar algumas horas para passeios, brincadeiras e cuidados." },
              { value: "muito", id: "tempo-muito", title: "Muito", description: "Tenho bastante tempo livre e gosto de me dedicar ao meu pet" },
            ]}
            columns={3}
          />
          {errors.tempoCuidar && <span className="text-red-500 text-xs mt-2 block">{errors.tempoCuidar}</span>}
        </div>

        <div>
          <Label className="text-base font-semibold block mb-1">
            3. Qual dessas opções descreve melhor seu estilo de vida?
          </Label>
          <p className={legendClass}>Pense na sua rotina diária e no tipo de companhia que está procurando.</p>
          <RadioCardGroup
            name="estiloVida"
            value={form.estiloVida}
            onValueChange={(v) => setForm({ ...form, estiloVida: v })}
            options={[
              { value: "tranquila", id: "vida-tranquila", title: "Tranquila", description: "Meu tempo livre é para descansar e recarregar as energias." },
              { value: "equilibrado", id: "vida-equilibrado", title: "Equilibrado", description: "Intercalo períodos de atividade com momentos de descanso." },
              { value: "acao", id: "vida-acao", title: "Sempre em ação", description: "Exercícios, passeios e atividades físicas fazem parte da minha rotina." },
            ]}
            columns={3}
          />
          {errors.estiloVida && <span className="text-red-500 text-xs mt-2 block">{errors.estiloVida}</span>}
        </div>

        <div>
          <Label className="text-base font-semibold block mb-1">
            4. Como é o espaço da sua casa?
          </Label>
          <p className={legendClass}>Descreva o ambiente onde seu pet vai viver.</p>
          <RadioCardGroup
            name="espaco"
            value={form.espaco}
            onValueChange={(v) => setForm({ ...form, espaco: v })}
            options={[
              { value: "pequeno", id: "espaco-pequeno", title: "Pequeno", description: "Apartamento pequeno ou casa sem quintal/jardim." },
              { value: "area_interna", id: "espaco-interno", title: "Área interna", description: "Casa ou apartamento espaçoso, mas sem área externa própria" },
              { value: "quintal", id: "espaco-quintal", title: "Quintal", description: "Tenho quintal, jardim ou espaço ao ar livre para o pet brincar" },
            ]}
            columns={3}
          />
          {errors.espaco && <span className="text-red-500 text-xs mt-2 block">{errors.espaco}</span>}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" variant="outline" onClick={onBack} className="w-1/2">Voltar</Button>
        <Button type="submit" className="w-1/2">Próximo</Button>
      </div>
    </form>
  )
}
