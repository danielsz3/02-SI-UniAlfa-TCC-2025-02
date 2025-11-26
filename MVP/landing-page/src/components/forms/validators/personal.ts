import { isDateISO, isEmail, onlyDigits } from "./shared"

export function validatePersonal(form: any) {
  const e: Record<string, string> = {}

  if (!form.nome || form.nome.trim().length < 2) e.nome = "Informe um nome com pelo menos 2 caracteres."
  if (!isEmail(form.email)) e.email = "E-mail inválido."

  const cpf = onlyDigits(form.cpf)
  if (!cpf || cpf.length !== 11) e.cpf = "CPF deve ter 11 dígitos."

  const tel = onlyDigits(form.telefone)
  if (!tel || tel.length !== 11) e.telefone = "Telefone deve ter 11 dígitos (inclua DDD)."

  if (!isDateISO(form.dataNascimento)) e.dataNascimento = "Use o formato YYYY-MM-DD."

  const pwd = form.senha || ""
  if (pwd.length < 8) e.senha_len = "Senha deve ter no mínimo 8 caracteres."
  if (!/[A-Z]/.test(pwd) || !/\d/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd))
    e.senha_strength = "Senha deve ter 1 maiúscula, 1 número e 1 caractere especial."
  if (form.senha !== form.confirmarSenha) e.confirmarSenha = "As senhas não coincidem."

  return e
}
