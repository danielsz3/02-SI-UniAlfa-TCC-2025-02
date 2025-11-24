import { isValidCPF, cleanCPF } from "./cpf"

export function validatePersonal(form: {
  nome: string
  telefone: string
  email: string
  cpf: string
  dataNascimento: string
  senha: string
  confirmarSenha: string
}): Record<string, string> {
  const errors: Record<string, string> = {}

  // Nome
  if (!form.nome || form.nome.trim().length < 2) {
    errors.nome = "O nome deve ter pelo menos 2 caracteres."
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email || !emailRegex.test(form.email)) {
    errors.email = "Digite um e-mail válido."
  }

  // Telefone (11 dígitos)
  const telefoneLimpo = form.telefone.replace(/\D/g, "")
  if (!telefoneLimpo || telefoneLimpo.length !== 11) {
    errors.telefone = "O telefone deve ter 11 dígitos (DDD + número)."
  }

  // CPF - validação completa
  const cpfLimpo = cleanCPF(form.cpf)
  if (!cpfLimpo || cpfLimpo.length !== 11) {
    errors.cpf = "O CPF deve ter 11 dígitos."
  } else if (!isValidCPF(cpfLimpo)) {
    errors.cpf = "CPF inválido. Verifique os números digitados."
  }

  // Data de nascimento
  if (!form.dataNascimento) {
    errors.dataNascimento = "A data de nascimento é obrigatória."
  } else {
    const dataNasc = new Date(form.dataNascimento)
    const hoje = new Date()
    const idade = hoje.getFullYear() - dataNasc.getFullYear()
    if (idade < 18) {
      errors.dataNascimento = "Você deve ter pelo menos 18 anos."
    }
    if (dataNasc > hoje) {
      errors.dataNascimento = "A data de nascimento não pode ser futura."
    }
  }

  // Senha - mínimo 8 caracteres
  if (!form.senha || form.senha.length < 8) {
    errors.senha_len = "A senha deve ter no mínimo 8 caracteres."
  }

  // Senha - força (maiúscula, número, caractere especial)
  const senhaRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
  if (form.senha && !senhaRegex.test(form.senha)) {
    errors.senha_strength =
      "A senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial."
  }

  // Confirmar senha
  if (form.senha !== form.confirmarSenha) {
    errors.confirmarSenha = "As senhas não coincidem."
  }

  return errors
}
