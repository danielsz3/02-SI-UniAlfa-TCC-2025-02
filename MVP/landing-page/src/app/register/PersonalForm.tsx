"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import TextField from "@/components/forms/inputs/TextField"
import PasswordField from "@/components/forms/inputs/PasswordField"
import { validatePersonal } from "@/components/forms/validators/personal"

export default function PersonalForm({ onNext, defaultValues = {} }: any) {
  const [form, setForm] = useState({
    nome: defaultValues.nome || "",
    telefone: defaultValues.telefone || "",
    email: defaultValues.email || "",
    cpf: defaultValues.cpf || "",
    dataNascimento: defaultValues.dataNascimento || "",
    senha: "",
    confirmarSenha: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const eobj = validatePersonal(form)
    setErrors(eobj)
    if (Object.keys(eobj).length) return
    onNext(form)
  }

  return (
    <form className="space-y-6 w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mt-8" onSubmit={submit}>
      <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Dados Pessoais</h2>

      <TextField id="nome" name="nome" label="Nome" value={form.nome} onChange={handle} required minLength={2} error={errors.nome}/>
      <TextField id="email" name="email" label="E-mail" type="email" value={form.email} onChange={handle} required error={errors.email}/>
      <TextField id="telefone" name="telefone" label="Telefone" value={form.telefone} onChange={handle} required placeholder="44997221511" error={errors.telefone}/>
      <TextField id="cpf" name="cpf" label="CPF" value={form.cpf} onChange={handle} required placeholder="Somente números" error={errors.cpf}/>
      <TextField id="dataNascimento" name="dataNascimento" label="Data de Nascimento" type="date" value={form.dataNascimento} onChange={handle} required error={errors.dataNascimento}/>
      <PasswordField id="senha" name="senha" label="Senha" value={form.senha} onChange={handle} required error={errors.senha_len || errors.senha_strength}/>
      <PasswordField id="confirmarSenha" name="confirmarSenha" label="Confirmar Senha" value={form.confirmarSenha} onChange={handle} required error={errors.confirmarSenha}/>

      <Button type="submit" className="w-full mt-2">Próximo</Button>
    </form>
  )
}
