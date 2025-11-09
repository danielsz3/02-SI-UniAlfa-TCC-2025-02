"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import TextField from "@/components/forms/inputs/TextField"
import PasswordField from "@/components/forms/inputs/PasswordField"
import { AvatarUpload } from "@/components/forms/inputs/AvatarUpload"
import { validatePersonal } from "@/components/forms/validators/personal"

interface PersonalFormProps {
  onNext: (data: any) => void
  defaultValues: {
    nome?: string
    telefone?: string
    email?: string
    cpf?: string
    dataNascimento?: string
    senha?: string
    confirmarSenha?: string
    imagemPreviewUrl?: string | null
  }
  defaultImageFile: File | null
  setImageFile: (file: File | null) => void
}

export default function PersonalForm({ onNext, defaultValues, defaultImageFile, setImageFile }: PersonalFormProps) {
  const [form, setForm] = useState({
    nome: defaultValues.nome || "",
    telefone: defaultValues.telefone || "",
    email: defaultValues.email || "",
    cpf: defaultValues.cpf || "",
    dataNascimento: defaultValues.dataNascimento || "",
    senha: defaultValues.senha || "",
    confirmarSenha: defaultValues.confirmarSenha || "",
  })

  const [imagem, setImagem] = useState<File | null>(defaultImageFile)
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValues.imagemPreviewUrl || null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sincroniza o estado local com defaultValues quando eles mudam (ex: ao voltar para a etapa)
  useEffect(() => {
    setForm({
      nome: defaultValues.nome || "",
      telefone: defaultValues.telefone || "",
      email: defaultValues.email || "",
      cpf: defaultValues.cpf || "",
      dataNascimento: defaultValues.dataNascimento || "",
      senha: defaultValues.senha || "",
      confirmarSenha: defaultValues.confirmarSenha || "",
    })

    if (!imagem) {
      setPreviewUrl(defaultValues.imagemPreviewUrl || null)
    }
  }, [defaultValues])

  // Cria e libera URL temporária para o arquivo File
  useEffect(() => {
    if (imagem) {
      const url = URL.createObjectURL(imagem)
      setPreviewUrl(url)

      return () => {
        URL.revokeObjectURL(url)
        setPreviewUrl(null)
      }
    }
  }, [imagem])

  // Atualiza estado local e também o estado do pai para o arquivo
  const handleImageChange = (file: File | null) => {
    setImagem(file)
    setImageFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const validationErrors = validatePersonal(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = {
      ...form,
      imagem, // arquivo File | null
    }

    onNext(payload)
  }

  return (
    <form
      className="space-y-6 w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mt-8"
      onSubmit={handleSubmit}
      encType="multipart/form-data"
    >
      <h2 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">
        Dados Pessoais
      </h2>

      <AvatarUpload
        label="Foto de Perfil"
        name="imagem"
        defaultPreviewUrl={previewUrl}
        onChange={handleImageChange}
      />

      <TextField
        id="nome"
        name="nome"
        label="Nome Completo"
        value={form.nome}
        onChange={handleChange}
        required
        minLength={2}
        error={errors.nome}
        placeholder="Digite seu nome completo"
      />

      <TextField
        id="email"
        name="email"
        label="E-mail"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
        error={errors.email}
        placeholder="seu@email.com"
      />

      <TextField
        id="telefone"
        name="telefone"
        label="Telefone"
        value={form.telefone}
        onChange={handleChange}
        required
        placeholder="(11) 98765-4321"
        error={errors.telefone}
      />

      <TextField
        id="cpf"
        name="cpf"
        label="CPF"
        value={form.cpf}
        onChange={handleChange}
        required
        placeholder="Somente números"
        error={errors.cpf}
      />

      <TextField
        id="dataNascimento"
        name="dataNascimento"
        label="Data de Nascimento"
        type="date"
        value={form.dataNascimento}
        onChange={handleChange}
        required
        error={errors.dataNascimento}
      />

      <PasswordField
        id="senha"
        name="senha"
        label="Senha"
        value={form.senha}
        onChange={handleChange}
        required
        error={errors.senha_len || errors.senha_strength}
      />

      <PasswordField
        id="confirmarSenha"
        name="confirmarSenha"
        label="Confirmar Senha"
        value={form.confirmarSenha}
        onChange={handleChange}
        required
        error={errors.confirmarSenha}
      />

      <Button type="submit" className="w-full mt-6" size="lg">
        Próximo
      </Button>
    </form>
  )
}
