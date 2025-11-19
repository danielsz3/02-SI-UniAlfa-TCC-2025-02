"use client"

import { ChangeEvent, useState } from "react"
import TextField from "@/components/forms/inputs/TextField"
import CepField from "@/components/forms/inputs/CepField"
import { Button } from "@/components/ui/button"
import { FormData } from "./page"

interface AddressFormEditProps {
  defaultValues: FormData
  onNext: (data: Partial<FormData>) => void
  onBack?: () => void
}

export default function AddressFormEdit({ defaultValues, onNext, onBack }: AddressFormEditProps) {
  const [form, setForm] = useState<Partial<FormData>>(defaultValues)

  const updateField = (name: keyof FormData, value: any) => setForm(prev => ({ ...prev, [name]: value }))

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => updateField(e.target.name as keyof FormData, e.target.value)

  return (
    <div className="space-y-6 w-full">
      <CepField
        value={form.cep ?? ""}
        onChange={(v) => updateField("cep", v)}
        onAddress={(addr: Record<string, string>) => Object.entries(addr).forEach(([k, v]) => updateField(k as keyof FormData, v))}
      />

      <TextField id="logradouro" name="logradouro" label="Logradouro" value={form.logradouro ?? ""} onChange={handleChange} />
      <TextField id="numero" name="numero" label="Número" value={form.numero ?? ""} onChange={handleChange} />
      <TextField id="complemento" name="complemento" label="Complemento" value={form.complemento ?? ""} onChange={handleChange} />
      <TextField id="bairro" name="bairro" label="Bairro" value={form.bairro ?? ""} onChange={handleChange} />
      <TextField id="cidade" name="cidade" label="Cidade" value={form.cidade ?? ""} onChange={handleChange} />
      <TextField id="estado" name="estado" label="UF" value={form.estado ?? ""} onChange={handleChange} maxLength={2} />

      <div className="flex gap-3">
        {onBack && <Button variant="outline" onClick={onBack} className="w-1/2">Voltar</Button>}
        <Button onClick={() => onNext(form)} className="w-1/2">Próximo</Button>
      </div>
    </div>
  )
}
