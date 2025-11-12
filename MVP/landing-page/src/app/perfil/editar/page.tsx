'use client'

import { useState, useEffect } from 'react'
import PersonalForm from '@/app/register/PersonalForm'
import AddressForm from '@/app/register/AddressForm'
import PreferencesForm from '@/app/register/PreferencesForm'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'

interface FormDataType {
    [key: string]: any
}

function normalizeUserData(data: any): FormDataType {
    return {
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cpf: data.cpf || '',
        dataNascimento: data.data_nascimento || '',
        senha: '', // não preenche senha por segurança
        confirmarSenha: '',
        imagemPreviewUrl: data.imagem_url || null,

        cep: data.endereco?.cep || '',
        logradouro: data.endereco?.logradouro || '',
        complemento: data.endereco?.complemento || '',
        numero: data.endereco?.numero || '',
        bairro: data.endereco?.bairro || '',
        cidade: data.endereco?.cidade || '',
        estado: data.endereco?.uf || '',

        tamanhoPet: data.preferencias?.tamanho_pet || '',
        tempoCuidar: data.preferencias?.tempo_disponivel || '',
        estiloVida: data.preferencias?.estilo_vida || '',
        espaco: data.preferencias?.espaco_casa || '',
    }
}

function prepareUserDataForSave(formData: FormDataType) {
    return {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
        data_nascimento: formData.dataNascimento,
        senha: formData.senha || undefined, // envie senha só se preenchida

        endereco: {
            cep: formData.cep,
            logradouro: formData.logradouro,
            complemento: formData.complemento,
            numero: formData.numero,
            bairro: formData.bairro,
            cidade: formData.cidade,
            uf: formData.estado,
        },

        preferencias: {
            tamanho_pet: formData.tamanhoPet,
            tempo_disponivel: formData.tempoCuidar,
            estilo_vida: formData.estiloVida,
            espaco_casa: formData.espaco,
        },
    }
}

export default function EditProfilePage() {
    const router = useRouter()
    const auth = useAuth()
    const token = auth?.token ?? undefined // undefined enquanto carrega, null se não autenticado

    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState<FormDataType | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Só tenta buscar dados se token for string (carregado)
        if (typeof token !== 'string') return

        async function fetchUserData() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) throw new Error('Erro ao carregar dados do usuário')
                const data = await res.json()
                const normalized = normalizeUserData(data)
                setFormData(normalized)
            } catch (err) {
                alert('Erro ao carregar dados do usuário. Faça login novamente.')
                router.replace('/login')
            } finally {
                setLoading(false)
            }
        }
        fetchUserData()
    }, [token, router])

    // Se token for null (não autenticado), redireciona para login
    useEffect(() => {
        if (token === null) {
            router.replace('/login')
        }
    }, [token, router])

    function nextStep(data: FormDataType) {
        setFormData((prev: FormDataType | null) => ({ ...prev, ...data }))
        setStep((s) => s + 1)
    }

    function prevStep() {
        setStep((s) => s - 1)
    }

    async function handleSave() {
        if (!token) {
            router.replace('/login')
            return
        }
        try {
            if (!formData) throw new Error('Dados do formulário não disponíveis')

            const payload = prepareUserDataForSave(formData)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error('Erro ao salvar dados')
            alert('Perfil atualizado com sucesso!')
            router.push('/')
        } catch (err: any) {
            alert(err.message || 'Erro desconhecido')
        }
    }

    if (loading || typeof token === 'undefined') return <p>Carregando dados...</p>
    if (!formData) return <p>Erro ao carregar dados do usuário.</p>

    return (
        <main className="min-h-screen p-4 max-w-4xl mx-auto">
            {step === 1 && (
                <PersonalForm
                    onNext={nextStep}
                    defaultValues={formData}
                    defaultImageFile={null}
                    setImageFile={(file) =>
                        setFormData((prev: FormDataType | null) => ({
                            ...prev,
                            imagemPreviewUrl: file ? URL.createObjectURL(file) : null,
                            imagem: file || null,
                        }))
                    }
                />
            )}
            {step === 2 && (
                <AddressForm onNext={nextStep} onBack={prevStep} defaultValues={formData} />
            )}
            {step === 3 && (
                <PreferencesForm onNext={handleSave} onBack={prevStep} defaultValues={formData} />
            )}
        </main>
    )
}
