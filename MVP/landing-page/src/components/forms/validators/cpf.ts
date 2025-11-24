/**
 * Remove caracteres não numéricos do CPF
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "")
}

/**
 * Formata CPF para exibição: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf)
  return cleaned
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

/**
 * Valida CPF usando o algoritmo dos dígitos verificadores
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf)

  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  // Calcula o primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit1 = 11 - (sum % 11)
  if (digit1 >= 10) digit1 = 0

  // Verifica o primeiro dígito
  if (digit1 !== parseInt(cleaned.charAt(9))) return false

  // Calcula o segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  let digit2 = 11 - (sum % 11)
  if (digit2 >= 10) digit2 = 0

  // Verifica o segundo dígito
  if (digit2 !== parseInt(cleaned.charAt(10))) return false

  return true
}
