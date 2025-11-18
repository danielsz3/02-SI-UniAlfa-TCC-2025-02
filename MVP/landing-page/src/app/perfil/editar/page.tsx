"use client"

import { useEffect, useState } from "react"
import PersonalForm from "@/app/register/PersonalForm"
import AddressForm from "@/app/register/AddressForm"
import PreferencesForm from "@/app/register/PreferencesForm"
import { useRouter } from "next/navigation"

export default function EditProfilePage() {
  const router = useRouter()

  const [step, setStep] = useState(0)

  const [form, setForm] = useState<any>({
    nome: "",
    sobrenome: "",
    telefone: "",
    sexo: "",
    email: "",
    cpf: "",
    dataNascimento: "",
    senha: undefined,
    confirmarSenha: undefined,
  })

  const [addressForm, setAddressForm] = useState({
    cep: "",
    logradouro: "",
    complemento: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  })

  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<any>({})

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const [data, setData] = useState<any>({
    personal: {},
    address: {},
    preferences: {},
  })

  const updateField = (name: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleNext = (formData: any) => {
    if (step === 0) setData((p: any) => ({ ...p, personal: formData }))
    if (step === 1) setData((p: any) => ({ ...p, address: formData }))
    if (step === 2) setData((p: any) => ({ ...p, preferences: formData }))

    setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const handleSubmit = async () => {
    await fetch("https://sua-api.com/usuarios/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    router.push("/perfil")
  }

  // 🔥 Buscar dados reais da sua API
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("https://sua-api.com/usuarios/me")
        const usuario = await res.json()

        // Preenche form (dados pessoais)
        setForm({
          nome: usuario.nome || "",
          sobrenome: usuario.sobrenome || "",
          telefone: usuario.telefone || "",
          sexo: usuario.sexo || "",
          email: usuario.email || "",
          cpf: usuario.cpf || "",
          dataNascimento: usuario.dataNascimento || "",
          senha: undefined,
          confirmarSenha: undefined,
        })

        // Preenche endereço
        setAddressForm({
          cep: usuario.cep || "",
          logradouro: usuario.logradouro || "",
          complemento: usuario.complemento || "",
          numero: usuario.numero || "",
          bairro: usuario.bairro || "",
          cidade: usuario.cidade || "",
          estado: usuario.estado || "",
        })

        // Preenche "data" completo
        setData({
          personal: {
            nome: usuario.nome,
            sobrenome: usuario.sobrenome,
            telefone: usuario.telefone,
            sexo: usuario.sexo,
            email: usuario.email,
            cpf: usuario.cpf,
            dataNascimento: usuario.dataNascimento,
          },
          address: {
            cep: usuario.cep,
            logradouro: usuario.logradouro,
            complemento: usuario.complemento,
            numero: usuario.numero,
            bairro: usuario.bairro,
            cidade: usuario.cidade,
            estado: usuario.estado,
          },
          preferences: {
            tamanhoPet: usuario.tamanhoPet,
            tempoCuidar: usuario.tempoCuidar,
            estiloVida: usuario.estiloVida,
            espaco: usuario.espaco,
          },
        })
      } catch (err) {
        console.error("Erro ao carregar usuário:", err)
      }
    }

    loadUser()
  }, [])

  // Preview da imagem
  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  return (
    <div className="w-full flex justify-center py-10">
      {step === 0 && (
        <PersonalForm
          form={form}
          updateField={updateField}
          errors={errors}
          imagePreviewUrl={imagePreviewUrl}
          setImageFile={setImageFile}
        />
      )}

      {step === 1 && (
        <AddressForm
          onNext={handleNext}
          onBack={handleBack}
          defaultValues={addressForm}
        />
      )}

      {step === 2 && (
        <PreferencesForm
          onNext={handleNext}
          onBack={handleBack}
          defaultValues={data.preferences}
        />
      )}

      {step === 3 && (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Confirme os dados</h2>

          <pre className="text-left bg-slate-900 text-white p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>

          <button
            onClick={handleSubmit}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg"
          >
            Salvar Alterações
          </button>
        </div>
      )}
    </div>
  )
}
