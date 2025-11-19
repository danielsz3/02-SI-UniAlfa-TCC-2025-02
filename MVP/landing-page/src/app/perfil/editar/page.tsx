"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import PersonalFormEdit from "@/app/perfil/editar/PersonalFormEdit"
import AddressFormEdit from "@/app/perfil/editar/AddressFormEdit"
import PreferencesFormEdit from "@/app/perfil/editar/PreferencesFormEdit"

import { apiGet, apiMultipart, apiPost } from "@/lib/api"

export interface FormData {
  id_usuario?: number
  nome?: string
  email?: string
  telefone?: string
  cpf?: string
  data_nascimento?: string
  senha?: string
  senha_confirmation?: string
  avatar?: File | null

  // Endereço
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string

  // Preferências
  notificacoesEmail?: boolean
  notificacoesPush?: boolean
  tamanho_pet?: string
  tempo_disponivel?: string
  estilo_vida?: string
  espaco_casa?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const user = await apiGet<any>("usuarios/me")
        const endereco = await apiGet<any>("enderecos/" + user.id)
        const preferencias = await apiGet<any>("preferencias-usuarios/" + user.id)

        setFormData({
          ...user,
          ...endereco,
          ...preferencias,
        })
      } catch (err: any) {
        console.error(err)
        toast.error("Erro ao carregar dados do perfil", { richColors: true })
      }
    }
    loadData()
  }, [])

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
    if (!payload.id_usuario) return toast.error("ID do usuário não encontrado", { richColors: true })

    try {
      // 1️⃣ Atualiza usuário (incluindo avatar)
      const userForm = new FormData()
      userForm.append("nome", payload.nome || "")
      userForm.append("email", payload.email || "")
      userForm.append("telefone", payload.telefone || "")
      if (avatarFile) userForm.append("avatar", avatarFile)

      await apiMultipart(`usuarios/${payload.id_usuario}`, userForm, { method: "PUT" })

      // 2️⃣ Atualiza endereço
      const enderecoForm = new FormData()
      enderecoForm.append("logradouro", payload.logradouro || "")
      enderecoForm.append("numero", payload.numero || "")
      enderecoForm.append("complemento", payload.complemento || "")
      enderecoForm.append("bairro", payload.bairro || "")
      enderecoForm.append("cidade", payload.cidade || "")
      enderecoForm.append("estado", payload.estado || "")
      enderecoForm.append("cep", payload.cep || "")

      await apiMultipart(`enderecos/${payload.id_usuario}`, enderecoForm, { method: "PUT" })

      // 3️⃣ Atualiza preferências
      await apiPost(`preferencias-usuarios/${payload.id_usuario}`, {
        notificacoesEmail: payload.notificacoesEmail ?? false,
        notificacoesPush: payload.notificacoesPush ?? false,
        tamanho_pet: payload.tamanho_pet || "",
        tempo_disponivel: payload.tempo_disponivel || "",
        estilo_vida: payload.estilo_vida || "",
        espaco_casa: payload.espaco_casa || "",
      })

      toast.success("Perfil atualizado com sucesso!", { richColors: true })
      router.push("/")
    } catch (err: any) {
      console.error(err)
      toast.error("Erro ao salvar perfil", { richColors: true })
    }
  }

  return (
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
  )
}
