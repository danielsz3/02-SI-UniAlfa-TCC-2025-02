"use client"

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import TextField from "@/components/forms/inputs/TextField"
import CepField from "@/components/forms/inputs/CepField"
import { useAuth } from "@/components/Providers"
import { AvatarUpload } from "@/components/forms/inputs/AvatarUpload"
import { Label } from "@/components/ui/label"
import RadioCardGroup from "@/components/forms/inputs/RadioCardGroup"
import { getToken } from "@/lib/api"

const legendClass = "text-sm text-gray-600 dark:text-gray-400 mb-4"

const API = process.env.NEXT_PUBLIC_API_URL

export default function EditarPerfilPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const { user, } = useAuth()

  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    tamanhoPet: "",
    tempoCuidar: "",
    estiloVida: "",
    espaco: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {

    async function carregarDadosUsuario() {
      try {
        const token = getToken()

        if (user?.id === undefined) {
          return
        }

        const res = await fetch(`${API}/usuarios/${user?.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          throw new Error("Falha ao validar token ou buscar dados")
        }

        const dadosUsuario = await res.json()

        setForm({
          nome: dadosUsuario.nome || "",
          email: dadosUsuario.email || "",
          cpf: dadosUsuario.cpf || "",
          dataNascimento: new Date(dadosUsuario.data_nascimento).toISOString().split("T")[0] || "",
          telefone: dadosUsuario.telefone || "",
          cep: dadosUsuario.endereco?.cep || "",
          logradouro: dadosUsuario.endereco?.logradouro || "",
          numero: dadosUsuario.endereco?.numero || "",
          complemento: dadosUsuario.endereco?.complemento || "",
          bairro: dadosUsuario.endereco?.bairro || "",
          cidade: dadosUsuario.endereco?.cidade || "",
          estado: dadosUsuario.endereco?.uf || "",
          tamanhoPet: dadosUsuario.preferencias?.tamanho_pet || "",
          tempoCuidar: dadosUsuario.preferencias?.tempo_disponivel || "",
          estiloVida: dadosUsuario.preferencias?.estilo_vida || "",
          espaco: dadosUsuario.preferencias?.espaco_casa || "",
        })

        setImagePreviewUrl(`${API}/imagens/${dadosUsuario.imagem}`)


      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setIsLoading(false)
      }
    }

    carregarDadosUsuario()
  }, [router, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando dados...</p>
      </div>
    )
  }
  const handleImageChange = (file: File | null) => {
    setImageFile(file)

    if (file) {
      const url = URL.createObjectURL(file)
      setImagePreviewUrl(url)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()

    const token = localStorage.getItem("token") || ""

    if (!user?.id) {
      console.error("Usuário não está definido ou não tem ID")
      return
    }

    setErrors({})

    const formData = new FormData()

    formData.append("_method", "PUT")

    formData.append("nome", form.nome)
    formData.append("email", form.email)
    formData.append("cpf", form.cpf)
    formData.append("data_nascimento", form.dataNascimento)
    formData.append("telefone", form.telefone)

    formData.append("endereco[cep]", form.cep)
    formData.append("endereco[logradouro]", form.logradouro)
    formData.append("endereco[numero]", form.numero)
    formData.append("endereco[complemento]", form.complemento)
    formData.append("endereco[bairro]", form.bairro)
    formData.append("endereco[cidade]", form.cidade)
    formData.append("endereco[uf]", form.estado)

    formData.append("preferencias[tamanho_pet]", form.tamanhoPet)
    formData.append("preferencias[tempo_disponivel]", form.tempoCuidar)
    formData.append("preferencias[estilo_vida]", form.estiloVida)
    formData.append("preferencias[espaco_casa]", form.espaco)

    if (imageFile) {
      formData.append("imagem", imageFile)
    }

    try {
      const res = await fetch(`${API}/usuarios/${user.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (res.ok) {
        const updated = await res.json()
        // Update succeeded; navigate home (auth context can be refreshed elsewhere if needed)
        router.push("/")
      } else {
        const errorText = await res.text()
        console.error("Erro ao salvar:", errorText)
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
    }
  }

  if (!user) return null

  return (
    <main className="min-h-screen md:py-24 py-8 px-4 bg-muted/30 dark:bg-muted flex items-center justify-center">
      <div className="container max-w-2xl w-full">
        <form
          onSubmit={salvar}
          className="space-y-10 bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg"
        >
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">
            Editar Perfil
          </h2>

          <AvatarUpload
            key={imagePreviewUrl || "sem-imagem"}
            label="Foto de Perfil"
            name="imagem"
            defaultPreviewUrl={imagePreviewUrl}
            onChange={handleImageChange}
          />

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Dados Pessoais
            </h3>

            <TextField
              id="nome"
              name="nome"
              label="Nome Completo"
              value={form.nome}
              onChange={handleChange}
              required
              error={errors.nome}
            />

            <TextField
              id="email"
              name="email"
              label="E-mail"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              error={errors.email}
            />

            <TextField
              id="telefone"
              name="telefone"
              label="Telefone"
              value={form.telefone}
              onChange={handleChange}
              error={errors.telefone}
            />

            <TextField
              id="cpf"
              name="cpf"
              label="CPF"
              value={form.cpf}
              onChange={handleChange}
              error={errors.cpf}
            />

            <TextField
              id="dataNascimento"
              name="dataNascimento"
              label="Data de Nascimento"
              type="date"
              value={form.dataNascimento}
              onChange={handleChange}
              error={errors.dataNascimento}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Endereço
            </h3>

            <CepField
              value={form.cep}
              onChange={(v) => setForm({ ...form, cep: v })}
              onAddress={(addr) => setForm((f) => ({ ...f, ...addr }))}
              error={errors.cep}
            />

            <TextField
              id="logradouro"
              name="logradouro"
              label="Logradouro"
              value={form.logradouro}
              onChange={handleChange}
              error={errors.logradouro}
            />

            <TextField
              id="numero"
              name="numero"
              label="Número"
              value={form.numero}
              onChange={handleChange}
              error={errors.numero}
            />

            <TextField
              id="complemento"
              name="complemento"
              label="Complemento"
              value={form.complemento}
              onChange={handleChange}
            />

            <TextField
              id="bairro"
              name="bairro"
              label="Bairro"
              value={form.bairro}
              onChange={handleChange}
              error={errors.bairro}
            />

            <TextField
              id="cidade"
              name="cidade"
              label="Cidade"
              value={form.cidade}
              onChange={handleChange}
              error={errors.cidade}
            />

            <TextField
              id="estado"
              name="estado"
              label="UF"
              maxLength={2}
              value={form.estado}
              onChange={handleChange}
              error={errors.estado}
            />
          </section>

          <section className="space-y-8">
            <div>
              <Label className="text-base font-semibold block mb-1">
                1. Que tamanho de pet você prefere?
              </Label>
              <p className={legendClass}>
                Considere o espaço da sua casa e sua preferência pessoal.
              </p>
              <RadioCardGroup
                name="tamanhoPet"
                value={form.tamanhoPet || ""}
                onValueChange={(v) => setForm({ ...form, tamanhoPet: v })}
                options={[
                  {
                    value: "pequeno",
                    id: "tamanho-pequeno",
                    title: "Pequeno",
                    description: "Pets que cabem no colo, fáceis de carregar (até 10kg).",
                  },
                  {
                    value: "medio",
                    id: "tamanho-medio",
                    title: "Médio",
                    description: "Pets nem muito grandes nem muito pequenos (10-25kg).",
                  },
                  {
                    value: "grande",
                    id: "tamanho-grande",
                    title: "Grande",
                    description: "Pets grandes que precisam de mais espaço (acima de 25kg).",
                  },
                ]}
                columns={3}
              />
              {errors.tamanhoPet && (
                <span className="text-red-500 text-xs mt-2 block">{errors.tamanhoPet}</span>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold block mb-1">
                2. Quanto tempo você tem disponível para cuidar do seu pet?
              </Label>
              <p className={legendClass}>
                Seja honesto sobre sua rotina e disponibilidade diária.
              </p>
              <RadioCardGroup
                name="tempoCuidar"
                value={form.tempoCuidar || ""}
                onValueChange={(v) => setForm({ ...form, tempoCuidar: v })}
                options={[
                  {
                    value: "pouco_tempo",
                    id: "tempo-pouco",
                    title: "Pouco",
                    description: "Prefiro pets mais independentes que não precisem de atenção.",
                  },
                  {
                    value: "tempo_moderado",
                    id: "tempo-moderado",
                    title: "Moderado",
                    description:
                      "Posso dedicar algumas horas para passeios, brincadeiras e cuidados.",
                  },
                  {
                    value: "muito_tempo",
                    id: "tempo-muito",
                    title: "Muito",
                    description: "Tenho bastante tempo livre e gosto de me dedicar ao meu pet",
                  },
                ]}
                columns={3}
              />
              {errors.tempoCuidar && (
                <span className="text-red-500 text-xs mt-2 block">{errors.tempoCuidar}</span>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold block mb-1">
                3. Qual dessas opções descreve melhor seu estilo de vida?
              </Label>
              <p className={legendClass}>
                Pense na sua rotina diária e no tipo de companhia que está procurando.
              </p>
              <RadioCardGroup
                name="estiloVida"
                value={form.estiloVida || ""}
                onValueChange={(v) => setForm({ ...form, estiloVida: v })}
                options={[
                  {
                    value: "baixa",
                    id: "vida-tranquila",
                    title: "Tranquila",
                    description: "Meu tempo livre é para descansar e recarregar as energias.",
                  },
                  {
                    value: "moderada",
                    id: "vida-equilibrado",
                    title: "Equilibrado",
                    description:
                      "Intercalo períodos de atividade com momentos de descanso.",
                  },
                  {
                    value: "alta",
                    id: "vida-acao",
                    title: "Sempre em ação",
                    description:
                      "Exercícios, passeios e atividades físicas fazem parte da minha rotina.",
                  },
                ]}
                columns={3}
              />
              {errors.estiloVida && (
                <span className="text-red-500 text-xs mt-2 block">{errors.estiloVida}</span>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold block mb-1">
                4. Como é o espaço da sua casa?
              </Label>
              <p className={legendClass}>Descreva o ambiente onde seu pet vai viver.</p>
              <RadioCardGroup
                name="espaco"
                value={form.espaco || ""}
                onValueChange={(v) => setForm({ ...form, espaco: v })}
                options={[
                  {
                    value: "area_pequena",
                    id: "espaco-pequeno",
                    title: "Pequeno",
                    description: "Apartamento pequeno ou casa sem quintal/jardim.",
                  },
                  {
                    value: "area_media",
                    id: "espaco-interno",
                    title: "Área interna",
                    description:
                      "Casa ou apartamento espaçoso, mas sem área externa própria",
                  },
                  {
                    value: "area_externa",
                    id: "espaco-quintal",
                    title: "Quintal",
                    description:
                      "Tenho quintal, jardim ou espaço ao ar livre para o pet brincar",
                  },
                ]}
                columns={3}
              />
              {errors.espaco && (
                <span className="text-red-500 text-xs mt-2 block">{errors.espaco}</span>
              )}
            </div>
          </section>
          <Button type="submit" className="w-full text-lg py-3">
            Salvar Alterações
          </Button>
        </form>
      </div>
    </main>
  )
}
