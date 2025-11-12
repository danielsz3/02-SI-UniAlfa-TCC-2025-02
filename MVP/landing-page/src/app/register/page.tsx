'use client'

import { useState, useEffect } from "react"
import PersonalForm from "./PersonalForm"
import AddressForm from "./AddressForm"
import PreferencesForm from "./PreferencesForm"
import ConfirmForm from "./ConfirmForm"
import { useRouter } from "next/navigation" // Corrigido para next/navigation

interface FormData {
    nome?: string
    telefone?: string
    email?: string
    cpf?: string
    dataNascimento?: string
    senha?: string
    confirmarSenha?: string
    imagemPreviewUrl?: string | null
    tamanhoPet?: string
    tempoCuidar?: string
    estiloVida?: string
    espaco?: string
}

async function handleRedirectAfterAuth(router: ReturnType<typeof useRouter>) {
    const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/'
    sessionStorage.removeItem('redirectAfterLogin')
    router.replace(redirectTo)
}

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState<FormData>({
        imagemPreviewUrl: null,
        tamanhoPet: "",
        tempoCuidar: "",
        estiloVida: "",
        espaco: "",
    })

    const [imagemFile, setImagemFile] = useState<File | null>(null)

    useEffect(() => {
        if (imagemFile) {
            const url = URL.createObjectURL(imagemFile)
            setFormData(prev => ({ ...prev, imagemPreviewUrl: url }))

            return () => {
                URL.revokeObjectURL(url)
            }
        }
    }, [imagemFile])

    function nextStep(data: Partial<FormData> & { imagem?: File | null }) {
        if (data.imagem) {
            setImagemFile(data.imagem)
            delete data.imagem
        }
        setFormData(prev => ({ ...prev, ...data }))
        setStep(s => s + 1)
    }

    function prevStep() {
        setStep(s => s - 1)
    }

    // Exemplo: função para ser chamada após o registro bem-sucedido
    async function onRegisterSuccess() {
        await handleRedirectAfterAuth(router)
    }

    return (
        <>
            <main className="flex min-h-screen flex-col items-center justify-center">
                {step === 1 && (
                    <PersonalForm
                        onNext={nextStep}
                        defaultValues={formData}
                        defaultImageFile={imagemFile}
                        setImageFile={setImagemFile}
                    />
                )}
                {step === 2 && (
                    <AddressForm onNext={nextStep} onBack={prevStep} defaultValues={formData} />
                )}
                {step === 3 && (
                    <PreferencesForm onNext={nextStep} onBack={prevStep} defaultValues={formData} />
                )}
                {step === 4 && (
                    <ConfirmForm
                        data={formData}
                        onBack={prevStep}
                        onRegisterSuccess={onRegisterSuccess} // Passe essa prop para ConfirmForm
                    />
                )}
            </main>
        </>
    )
}
