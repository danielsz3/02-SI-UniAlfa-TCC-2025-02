"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye, EyeOff } from "lucide-react"

export default function ConfirmForm({
  data,
  onBack,
}: {
  data: any
  onBack: () => void
}) {
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)

  useEffect(() => {
    if (data.imagem instanceof File) {
      const url = URL.createObjectURL(data.imagem)
      setImagePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (typeof data.imagem === "string" && data.imagem) {
      setImagePreviewUrl(data.imagem)
    } else if (data.imagemPreviewUrl) {
      setImagePreviewUrl(data.imagemPreviewUrl)
    } else {
      setImagePreviewUrl(null)
    }
  }, [data.imagem, data.imagemPreviewUrl])

  function buildRequestBody(data: any) {
    const topLevel = {
      nome: data.nome,
      email: data.email,
      password: data.senha,
      password_confirmation: data.confirmarSenha,
      cpf: data.cpf.replace(/\D/g, ""),
      data_nascimento: data.dataNascimento,
      telefone: data.telefone.replace(/\D/g, ""),
      role: data.role || "user",
    }

    const endereco = {
      cep: data.cep.replace(/\D/g, ""),
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.estado,
    }

    const preferencias = {
      tamanho_pet: (data.tamanhoPet || "").toLowerCase(),
      tempo_disponivel: data.tempoCuidar,
      estilo_vida: data.estiloVida,
      espaco_casa: data.espaco,
    }

    if (data.imagem instanceof File) {
      const fd = new FormData()

      Object.entries(topLevel).forEach(([k, v]) => {
        if (v) fd.append(k, String(v))
      })

      Object.entries(endereco).forEach(([k, v]) => {
        if (v) fd.append(`endereco[${k}]`, String(v))
      })

      Object.entries(preferencias).forEach(([k, v]) => {
        if (v) fd.append(`preferencias[${k}]`, String(v))
      })

      fd.append("imagem", data.imagem)

      return { body: fd, isFormData: true }
    }

    return {
      body: {
        ...topLevel,
        endereco,
        preferencias,
      },
      isFormData: false,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      const { body, isFormData } = buildRequestBody(data)

      if (!apiUrl)
        throw new Error("API URL não configurada (NEXT_PUBLIC_API_URL).")

      const res = await fetch(`${apiUrl}/usuarios`, {
        method: "POST",
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        body: isFormData ? (body as FormData) : JSON.stringify(body),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        if (errJson?.errors) {
          const serverFieldErrors: Record<string, string> = {}
          Object.entries(errJson.errors).forEach(([k, v]) => {
            const msgs = Array.isArray(v) ? v : [String(v)]
            serverFieldErrors[k] = msgs[0]
          })
          setFieldErrors(serverFieldErrors)
          const first = Object.values(serverFieldErrors)[0]
          throw new Error(typeof first === "string" ? first : "Erro de validação")
        }
        throw new Error(errJson?.message || "Erro ao cadastrar usuário")
      }

      setSuccess(true)
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao cadastrar usuário")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mt-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Cadastro realizado com sucesso!
        </h2>
        <p className="mb-4 text-slate-700 dark:text-slate-300">
          Você já pode fazer login.
        </p>
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
      </div>
    )
  }

  return (
    <form
      className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mt-8"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
        Confirme seus dados
      </h2>

      {imagePreviewUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={imagePreviewUrl}
            alt="Foto de Perfil"
            className="rounded-full w-32 h-32 object-cover border border-gray-300 dark:border-gray-600"
          />
        </div>
      )}

      {globalError && (
        <p className="text-red-600 text-center mb-4">{globalError}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Campo</TableHead>
            <TableHead className="w-2/3">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Dados pessoais */}
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>{data.nome}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>E-mail</TableCell>
            <TableCell>{data.email}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Telefone</TableCell>
            <TableCell>{data.telefone}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>CPF</TableCell>
            <TableCell>{data.cpf}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Data de Nascimento</TableCell>
            <TableCell>{data.dataNascimento}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Senha</TableCell>
            <TableCell className="flex items-center gap-2">
              <input
                type={showSenha ? "text" : "password"}
                value={data.senha || ""}
                readOnly
                className="bg-transparent border-b border-gray-300 dark:border-gray-600 rounded-none px-2 py-1 w-full focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Confirmar Senha</TableCell>
            <TableCell className="flex items-center gap-2">
              <input
                type={showConfirmarSenha ? "text" : "password"}
                value={data.confirmarSenha || ""}
                readOnly
                className="bg-transparent border-b border-gray-300 dark:border-gray-600 rounded-none px-2 py-1 w-full focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                aria-label={showConfirmarSenha ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
              >
                {showConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </TableCell>
          </TableRow>

          {/* Endereço */}
          <TableRow>
            <TableCell>CEP</TableCell>
            <TableCell>{data.cep}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Logradouro</TableCell>
            <TableCell>{data.logradouro}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Número</TableCell>
            <TableCell>{data.numero}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Complemento</TableCell>
            <TableCell>{data.complemento || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bairro</TableCell>
            <TableCell>{data.bairro || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Cidade</TableCell>
            <TableCell>{data.cidade}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>UF</TableCell>
            <TableCell>{data.estado}</TableCell>
          </TableRow>

          {/* Preferências */}
          <TableRow>
            <TableCell>Tamanho do Pet</TableCell>
            <TableCell>{data.tamanhoPet}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Tempo disponível</TableCell>
            <TableCell>{data.tempoCuidar}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Estilo de vida</TableCell>
            <TableCell>{data.estiloVida}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Espaço da casa</TableCell>
            <TableCell>{data.espaco}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-1/2"
          disabled={loading}
        >
          Voltar
        </Button>
        <Button type="submit" className="w-1/2" disabled={loading}>
          {loading ? "Enviando..." : "Confirmar Cadastro"}
        </Button>
      </div>
    </form>
  )
}
