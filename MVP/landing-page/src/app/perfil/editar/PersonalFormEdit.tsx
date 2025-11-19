"use client"

import { ChangeEvent, useState } from "react"
import TextField from "@/components/forms/inputs/TextField"
import PasswordField from "@/components/forms/inputs/PasswordField"
import { AvatarUpload } from "@/components/forms/inputs/AvatarUpload"
import { Button } from "@/components/ui/button"
import { FormData } from "./page"

interface PersonalFormEditProps {
  defaultValues: FormData
  onNext: (data: Partial<FormData> & { avatar?: File | null }) => void
  onBack?: () => void
  setAvatarFile?: (file: File | null) => void
}

export default function PersonalFormEdit({
  defaultValues,
  onNext,
  onBack,
  setAvatarFile,
}: PersonalFormEditProps) {
  const [form, setForm] = useState<Partial<FormData>>(defaultValues)

  const updateField = (name: keyof FormData, value: any) => {
    setForm((prev: any) => ({ ...prev, [name]: value }))
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    updateField(e.target.name as keyof FormData, e.target.value)
  }

  return (
    <div className="space-y-6 w-full">
      <AvatarUpload
        label="Foto de Perfil"
        name="avatar"
        defaultPreviewUrl={typeof form.avatar === "string" ? form.avatar : null}
        onChange={(file) => {
          updateField("avatar", file)
          if (setAvatarFile) setAvatarFile(file)
        }}
      />

      <TextField id="nome" name="nome" label="Nome completo" value={form.nome ?? ""} onChange={handleChange} required />
      <TextField id="email" name="email" label="E-mail" type="email" value={form.email ?? ""} onChange={handleChange} required />
      <TextField id="telefone" name="telefone" label="Telefone" value={form.telefone ?? ""} onChange={handleChange} />

      <PasswordField id="senha" name="senha" label="Senha" value={form.senha ?? ""} onChange={handleChange} />
      <PasswordField id="senha_confirmation" name="senha_confirmation" label="Confirmar senha" value={form.senha_confirmation ?? ""} onChange={handleChange} />

      <div className="flex gap-3">
        {onBack && <Button variant="outline" onClick={onBack} className="w-1/2">Voltar</Button>}
        <Button onClick={() => onNext(form)} className="w-1/2">Próximo</Button>
      </div>
    </div>
  )
}
