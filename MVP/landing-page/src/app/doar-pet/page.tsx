"use client"

import { useState, ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/inputs/FormInput"
import { FormSelect } from "@/components/forms/inputs/FormSelect"

export default function DoarPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nome: "",
    sexo: "",
    data_nascimento: "",
    castrado: "",
    vale_castracao: "",
    tipo_animal: "",
    descricao: "",
    nivel_energia: "",
    tamanho: "",
    tempo_necessario: "",
    ambiente_ideal: "",
    imagens: [] as File[],
  })
  const [preview, setPreview] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
  const MAX_FILES = 10
  const MAX_SIZE_BYTES = 10240 * 1024

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelect = (key: string) => (value: string) => {
    setFormData({ ...formData, [key]: value })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageError(null)
    const files = e.target.files ? Array.from(e.target.files) : []

    if (files.length === 0) {
      setFormData({ ...formData, imagens: [] })
      setPreview([])
      return
    }

    const totalCount = formData.imagens.length + files.length
    if (totalCount > MAX_FILES) {
      setImageError(`Você pode enviar no máximo ${MAX_FILES} imagens. (Selecionadas: ${files.length}, já adicionadas: ${formData.imagens.length})`)
      return
    }

    const invalid = files.find((f) => !ACCEPTED_TYPES.includes(f.type))
    if (invalid) {
      setImageError("Formato inválido. Aceitamos: jpeg, jpg, png, webp.")
      return
    }

    const oversized = files.find((f) => f.size > MAX_SIZE_BYTES)
    if (oversized) {
      setImageError("Cada imagem deve ter no máximo 10 MB.")
      return
    }

    const newFiles = [...formData.imagens, ...files]
    setFormData({ ...formData, imagens: newFiles })
    setPreview(newFiles.map((file) => URL.createObjectURL(file)))
    e.currentTarget.value = ""
  }

  const removeImage = (index: number) => {
    const newFiles = [...formData.imagens]
    newFiles.splice(index, 1)
    setFormData({ ...formData, imagens: newFiles })
    setPreview(newFiles.map((file) => URL.createObjectURL(file)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setImageError(null)

    try {
      if (formData.imagens.length > MAX_FILES) {
        throw new Error(`Máximo de ${MAX_FILES} imagens permitido.`)
      }
      for (const f of formData.imagens) {
        if (!ACCEPTED_TYPES.includes(f.type)) throw new Error("Formato de imagem inválido.")
        if (f.size > MAX_SIZE_BYTES) throw new Error("Cada imagem deve ter no máximo 10 MB.")
      }

      const data = new FormData()
      data.append("nome", formData.nome)
      data.append("sexo", formData.sexo)
      data.append("tipo_animal", formData.tipo_animal)
      data.append("status", "em_aprovacao")

      if (formData.data_nascimento) data.append("data_nascimento", formData.data_nascimento)
      if (formData.castrado) data.append("castrado", formData.castrado)
      if (formData.vale_castracao) data.append("vale_castracao", formData.vale_castracao)
      if (formData.descricao) data.append("descricao", formData.descricao)
      if (formData.nivel_energia) data.append("nivel_energia", formData.nivel_energia)
      if (formData.tamanho) data.append("tamanho", formData.tamanho)
      if (formData.tempo_necessario) data.append("tempo_necessario", formData.tempo_necessario)
      if (formData.ambiente_ideal) data.append("ambiente_ideal", formData.ambiente_ideal)

      formData.imagens.forEach((img) => data.append("imagens[]", img, img.name))

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/animais`, {
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Falha ao criar o animal")
      }

      router.push("/adotar")
    } catch (error: any) {
      console.error("Erro ao criar anúncio:", error)
      setImageError(error.message || "Não foi possível criar o anúncio. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="min-h-screen pt-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center font-bold">
                Formulário de Anúncio para Adoção
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                  label="Nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormSelect
                    label="Tipo de Animal"
                    required
                    options={[
                      { value: "cao", label: "Cão" },
                      { value: "gato", label: "Gato" },
                      { value: "outro", label: "Outro" },
                    ]}
                    onValueChange={handleSelect("tipo_animal")}
                  />

                  <FormSelect
                    label="Sexo"
                    required
                    options={[
                      { value: "macho", label: "Macho" },
                      { value: "femea", label: "Fêmea" },
                    ]}
                    onValueChange={handleSelect("sexo")}
                  />

                  <FormInput
                    label="Data de Nascimento"
                    name="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormSelect
                    label="Castrado?"
                    options={[
                      { value: "1", label: "Sim" },
                      { value: "0", label: "Não" },
                    ]}
                    onValueChange={handleSelect("castrado")}
                  />

                  <FormSelect
                    label="Vale-Castração?"
                    options={[
                      { value: "1", label: "Sim" },
                      { value: "0", label: "Não" },
                    ]}
                    onValueChange={handleSelect("vale_castracao")}
                  />

                  <FormSelect
                    label="Tamanho"
                    options={[
                      { value: "pequeno", label: "Pequeno" },
                      { value: "medio", label: "Médio" },
                      { value: "grande", label: "Grande" },
                    ]}
                    onValueChange={handleSelect("tamanho")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormSelect
                    label="Nível de Energia"
                    options={[
                      { value: "baixa", label: "Baixa" },
                      { value: "moderada", label: "Moderada" },
                      { value: "alta", label: "Alta" },
                    ]}
                    onValueChange={handleSelect("nivel_energia")}
                  />

                  <FormSelect
                    label="Tempo Necessário"
                    options={[
                      { value: "pouco_tempo", label: "Pouco Tempo" },
                      { value: "tempo_moderado", label: "Tempo Moderado" },
                      { value: "muito_tempo", label: "Muito Tempo" },
                    ]}
                    onValueChange={handleSelect("tempo_necessario")}
                  />

                  <FormSelect
                    label="Ambiente Ideal"
                    options={[
                      { value: "area_pequena", label: "Área Pequena" },
                      { value: "area_media", label: "Área Média" },
                      { value: "area_externa", label: "Área Externa" },
                    ]}
                    onValueChange={handleSelect("ambiente_ideal")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição do Animal</Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    placeholder="Conte sobre o comportamento, personalidade e história do animal..."
                    rows={4}
                    value={formData.descricao}
                    onChange={handleChange}
                    maxLength={2000}
                  />
                </div>

                <div>
                  <Label className="mb-2">Imagens (opcional)</Label>
                  <div className="rounded-lg border border-dashed border-border bg-background/50 p-4">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      multiple
                      onChange={handleFileChange}
                      className="w-full text-sm text-muted-foreground file:border-0 file:bg-transparent file:text-primary cursor-pointer"
                      aria-describedby="image-help"
                    />
                    <p id="image-help" className="mt-2 text-sm text-muted-foreground">
                      Aceitamos .jpeg, .jpg, .png, .webp — até {MAX_FILES} imagens, 10 MB cada.
                    </p>
                    {imageError && (
                      <p className="mt-2 text-sm text-destructive">
                        {imageError}
                      </p>
                    )}

                    {/* previews */}
                    {preview.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {preview.map((src, idx) => (
                          <div key={idx} className="relative rounded-md overflow-hidden border bg-muted">
                            <img
                              src={src}
                              alt={`preview-${idx}`}
                              className="w-32 h-32 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 inline-flex items-center justify-center rounded-full bg-destructive text-white w-6 h-6 text-xs shadow-md"
                              title="Remover imagem"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Salvar e Ir para Adoção"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
