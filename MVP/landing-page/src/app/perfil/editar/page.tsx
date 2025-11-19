"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import PersonalFormEdit from "@/app/perfil/editar/PersonalFormEdit"
import AddressFormEdit from "@/app/perfil/editar/AddressFormEdit"
import PreferencesFormEdit from "@/app/perfil/editar/PreferencesFormEdit"
import { apiGet, apiMultipart, apiPost, getToken } from "@/lib/api"
import { useAuth } from "@/components/Providers"
import NotToken from "@/components/NotToken"

export interface FormData {
  id_usuario?: number
  usuario_id?: number
  nome?: string
  email?: string
  telefone?: string
  cpf?: string
  data_nascimento?: string
  senha?: string
  senha_confirmation?: string
  avatar?: File | null

  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string

  notificacoesEmail?: boolean
  notificacoesPush?: boolean
  tamanho_pet?: string
  tempo_disponivel?: string
  estilo_vida?: string
  espaco_casa?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const { user, refreshUserFromStorage } = useAuth()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const token = getToken()
      if (!token) {
        toast.error("Você precisa estar logado", { richColors: true })
        router.push("/login")
        return
      }

      // 1. Carrega do localStorage primeiro (para exibir imediatamente)
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          console.log("✅ Usuário do localStorage:", parsedUser)

          setFormData(prev => ({
            ...prev,
            ...parsedUser,
            id_usuario: parsedUser.id_usuario || parsedUser.usuario_id || parsedUser.id
          }))
        } catch (err) {
          console.error("❌ Erro ao parsear usuário do localStorage:", err)
        }
      }

      // 2. Busca dados atualizados da API
      try {
        setLoading(true)

        // Busca dados do usuário autenticado
        const userData = await apiGet<any>("me") // SEM barra inicial
        console.log("✅ Dados do usuário da API:", userData)

        const userId = userData.id_usuario || userData.usuario_id || userData.id

        if (!userId) {
          throw new Error("ID do usuário não encontrado na resposta da API")
        }

        // Busca endereço (pode não existir ainda)
        let enderecoData = {}
        try {
          enderecoData = await apiGet<any>(`enderecos/${userId}`)
          console.log("✅ Dados do endereço:", enderecoData)
        } catch (err: any) {
          console.warn("⚠️ Endereço não encontrado (normal se for primeiro acesso):", err.message)
        }

        // Busca preferências (pode não existir ainda)
        let preferenciasData = {}
        try {
          preferenciasData = await apiGet<any>(`preferencias-usuarios/${userId}`)
          console.log("✅ Dados das preferências:", preferenciasData)
        } catch (err: any) {
          console.warn("⚠️ Preferências não encontradas (normal se for primeiro acesso):", err.message)
        }

        // Mescla todos os dados
        const mergedData = {
          ...userData,
          ...enderecoData,
          ...preferenciasData,
          id_usuario: userId
        }

        setFormData(mergedData)

        // Atualiza localStorage com dados frescos
        localStorage.setItem("user", JSON.stringify({
          ...userData,
          id_usuario: userId
        }))

      } catch (err: any) {
        console.error("❌ Erro ao carregar dados da API:", err)

        if (err.status === 401 || err.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente", { richColors: true })
          router.push("/login")
        } else if (err.status === 404 || err.response?.status === 404) {
          toast.error("Rota /api/me não encontrada. Verifique o backend.", { richColors: true })
          console.error("🔴 A rota GET /api/me retornou 404. Verifique se o Laravel está rodando e se a rota existe.")
        } else {
          toast.error("Erro ao carregar dados do perfil", { richColors: true })
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handlePersonalNext = (data: Partial<FormData> & { avatar?: File | null }) => {
    setFormData(prev => ({ ...prev, ...data }))
    if (data.avatar) setAvatarFile(data.avatar)
    setStep(1)
  }

  const handleAddressNext = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(2)
  }

  const handlePreferencesNext = async (data: Partial<FormData>) => {
    const updated = { ...formData, ...data }
    setFormData(updated)
    await handleSave(updated)
  }

  const handleBack = () => setStep(prev => Math.max(prev - 1, 0))

  const handleSave = async (payload: FormData) => {
    const userId = payload.id_usuario || payload.usuario_id

    if (!userId) {
      toast.error("ID do usuário não encontrado", { richColors: true })
      return
    }

    try {
      // 1. Atualiza dados do usuário
      const userForm = new FormData()
      userForm.append("nome", payload.nome || "")
      userForm.append("email", payload.email || "")
      userForm.append("telefone", payload.telefone || "")
      if (payload.cpf) userForm.append("cpf", payload.cpf)
      if (payload.data_nascimento) userForm.append("data_nascimento", payload.data_nascimento)
      if (avatarFile) userForm.append("avatar", avatarFile)

      await apiMultipart(`usuarios/${userId}`, userForm, { method: "PUT" })

      // 2. Atualiza endereço
      const enderecoForm = new FormData()
      enderecoForm.append("logradouro", payload.logradouro || "")
      enderecoForm.append("numero", payload.numero || "")
      enderecoForm.append("complemento", payload.complemento || "")
      enderecoForm.append("bairro", payload.bairro || "")
      enderecoForm.append("cidade", payload.cidade || "")
      enderecoForm.append("estado", payload.estado || "")
      enderecoForm.append("cep", payload.cep || "")

      await apiMultipart(`enderecos/${userId}`, enderecoForm, { method: "PUT" })

      // 3. Atualiza preferências
      await apiPost(`preferencias-usuarios/${userId}`, {
        notificacoesEmail: payload.notificacoesEmail ?? false,
        notificacoesPush: payload.notificacoesPush ?? false,
        tamanho_pet: payload.tamanho_pet || "",
        tempo_disponivel: payload.tempo_disponivel || "",
        estilo_vida: payload.estilo_vida || "",
        espaco_casa: payload.espaco_casa || "",
      })

      // 4. Atualiza localStorage
      const updatedUser = {
        ...payload,
        id_usuario: userId
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      refreshUserFromStorage()

      toast.success("Perfil atualizado com sucesso!", { richColors: true })
      router.push("/")
    } catch (err: any) {
      console.error("❌ Erro ao salvar perfil:", err)
      toast.error("Erro ao salvar perfil", { richColors: true })
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <NotToken>
        <div className="max-w-xl mx-auto p-4">
          {step === 0 && (
            <PersonalFormEdit
              onNext={handlePersonalNext}
              defaultValues={formData}
              setAvatarFile={setAvatarFile}
            />
          )}

          {step === 1 && (
            <AddressFormEdit
              onNext={handleAddressNext}
              onBack={handleBack}
              defaultValues={formData}
            />
          )}

          {step === 2 && (
            <PreferencesFormEdit
              onNext={handlePreferencesNext}
              onBack={handleBack}
              defaultValues={formData}
            />
          )}
        </div>
      </NotToken>
    </>
  )
}
