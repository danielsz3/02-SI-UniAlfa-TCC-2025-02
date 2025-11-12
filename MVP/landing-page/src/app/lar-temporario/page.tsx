"use client"

import { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiMultipart } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FormInput } from '@/components/forms/inputs/FormInput'
import { FormSelect } from '@/components/forms/inputs/FormSelect'
import CepField from '@/components/forms/inputs/CepField'
import TextField from '@/components/forms/inputs/TextField'
import NotToken from '@/components/NotToken'

type Endereco = {
    id?: number
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    uf?: string
}

type Imagem = {
    id?: number
    caminho?: string
    nome_original?: string
}

type LarTemporarioPayload = {
    id?: number
    nome?: string
    data_nascimento?: string
    telefone?: string
    situacao?: 'ativo' | 'inativo'
    experiencia?: string
    endereco?: Endereco
    imagens?: Imagem[]
}

type Props = {
    initialData?: LarTemporarioPayload | null
    apiBase?: string
    onSuccess?: (resp?: any) => void
}

export default function LarTemporarioForm({
    initialData = null,
    apiBase = 'lares-temporarios',
    onSuccess,
}: Props) {
    const [nome, setNome] = useState(initialData?.nome ?? '')
    const [dataNascimento, setDataNascimento] = useState(initialData?.data_nascimento ?? '')
    const [telefone, setTelefone] = useState(initialData?.telefone ?? '')
    const [situacao, setSituacao] = useState<'ativo' | 'inativo'>((initialData?.situacao as any) ?? 'inativo')
    const [experiencia, setExperiencia] = useState(initialData?.experiencia ?? '')

    const [endereco, setEndereco] = useState<Endereco>(initialData?.endereco ?? {})
    const [existingImages, setExistingImages] = useState<Imagem[]>(initialData?.imagens ?? [])
    const [removedExistingFileNames, setRemovedExistingFileNames] = useState<string[]>([])
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<{ name: string; url: string }[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})

    const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    const MAX_FILES = 10
    const MAX_SIZE_BYTES = 10 * 1024 * 1024

    useEffect(() => {
        if (initialData) {
            setNome(initialData.nome ?? '')
            setDataNascimento(initialData.data_nascimento ?? '')
            setTelefone(initialData.telefone ?? '')
            setSituacao((initialData.situacao as any) ?? 'inativo')
            setExperiencia(initialData.experiencia ?? '')
            setEndereco(initialData.endereco ?? {})
            setExistingImages(initialData.imagens ?? [])
        }
    }, [initialData])

    useEffect(() => {
        const urls = newFiles.map(f => ({ name: f.name, url: URL.createObjectURL(f) }))
        setPreviews(urls)
        return () => urls.forEach(u => URL.revokeObjectURL(u.url))
    }, [newFiles])

    const filenameFromPath = (pathOrUrl?: string) => {
        if (!pathOrUrl) return ''
        try {
            const parsed = new URL(pathOrUrl, window.location.origin)
            return parsed.pathname.split('/').pop() || ''
        } catch {
            return pathOrUrl.split('/').pop() || ''
        }
    }

    const toggleKeepExistingImage = (img: Imagem) => {
        const base = filenameFromPath(img.caminho)
        if (!base) return
        setRemovedExistingFileNames(prev => (prev.includes(base) ? prev.filter(x => x !== base) : [...prev, base]))
    }

    const handleFilesAdd = (filesList: FileList | null) => {
        if (!filesList) return
        const files = Array.from(filesList)

        const totalCount = newFiles.length + files.length
        if (totalCount > MAX_FILES) {
            setErrors(prev => ({ ...prev, imagens: [`Máximo de ${MAX_FILES} imagens permitido.`] }))
            return
        }

        const invalid = files.find(f => !ACCEPTED_TYPES.includes(f.type))
        if (invalid) {
            setErrors(prev => ({ ...prev, imagens: ['Formato inválido. Aceitamos: jpeg, jpg, png, webp.'] }))
            return
        }

        const oversized = files.find(f => f.size > MAX_SIZE_BYTES)
        if (oversized) {
            setErrors(prev => ({ ...prev, imagens: ['Cada imagem deve ter no máximo 10 MB.'] }))
            return
        }

        setErrors(prev => {
            const copy = { ...prev }
            delete copy.imagens
            return copy
        })
        setNewFiles(prev => [...prev, ...files])
    }

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        switch (name) {
            case 'nome': setNome(value); break
            case 'data_nascimento': setDataNascimento(value); break
            case 'telefone': setTelefone(value.replace(/\D/g, '')); break
            case 'cep': setEndereco(prev => ({ ...prev, cep: value })); break
            case 'logradouro': setEndereco(prev => ({ ...prev, logradouro: value })); break
            case 'complemento': setEndereco(prev => ({ ...prev, complemento: value })); break
            case 'numero': setEndereco(prev => ({ ...prev, numero: value })); break
            case 'bairro': setEndereco(prev => ({ ...prev, bairro: value })); break
            case 'cidade': setEndereco(prev => ({ ...prev, cidade: value })); break
            case 'estado': setEndereco(prev => ({ ...prev, uf: value })); break
            case 'experiencia': setExperiencia(value); break
            default: break
        }
    }

    const handleSelect = (key: string) => (value: string) => {
        if (key === 'situacao') setSituacao(value as 'ativo' | 'inativo')
    }

    const handleSubmit = async (e?: FormEvent) => {
        e?.preventDefault()
        setSubmitting(true)
        setErrors({})

        const clientErrors: Record<string, string[]> = {}
        if (!nome || nome.trim().length < 2) clientErrors.nome = ['O nome é obrigatório e deve ter no mínimo 2 caracteres.']
        if (!dataNascimento) clientErrors.data_nascimento = ['A data de nascimento é obrigatória.']
        if (!telefone || !/^\d{11}$/.test(telefone)) clientErrors.telefone = ['Telefone deve ter 11 dígitos numéricos.']
        if (Object.keys(clientErrors).length) {
            setErrors(clientErrors)
            setSubmitting(false)
            return
        }

        try {
            const fd = new FormData()
            const isEdit = !!initialData?.id
            const url = isEdit ? `${apiBase}/${initialData!.id}` : apiBase

            fd.append('nome', nome)
            fd.append('data_nascimento', dataNascimento)
            fd.append('telefone', telefone)
            fd.append('situacao', situacao)
            if (experiencia) fd.append('experiencia', experiencia)
            fd.append('endereco', JSON.stringify({ ...(endereco || {}) }))

            existingImages.forEach(img => {
                const filename = filenameFromPath(img.caminho)
                if (!removedExistingFileNames.includes(filename)) {
                    fd.append('imagens[]', JSON.stringify({ src: img.caminho }))
                }
            })

            newFiles.forEach(file => fd.append('imagens[]', file, file.name))

            const resp = await apiMultipart(url, fd, { method: isEdit ? 'PUT' : 'POST', useMethodOverride: true })

            if (onSuccess) onSuccess(resp)
            setSubmitting(false)
        } catch (err: any) {
            setSubmitting(false)
            try {
                const parsed = JSON.parse(err.message.replace('API error: ', ''))
                if (parsed?.errors) {
                    setErrors(parsed.errors)
                    return
                }
            } catch {

            }
            setErrors({ global: [err.message || 'Erro ao salvar.'] })
        }
    }

    return (
        <NotToken>
        <main className="min-h-screen pt-24 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center font-bold">
                            Formulário de Lar Temporário
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    label="Nome"
                                    name="nome"
                                    value={nome}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                />

                                <FormInput
                                    label="Data de Nascimento"
                                    name="data_nascimento"
                                    type="date"
                                    value={dataNascimento}
                                    onChange={handleChange}
                                />

                                <FormInput
                                    label="Telefone"
                                    name="telefone"
                                    value={telefone}
                                    onChange={handleChange}
                                    placeholder="(DDD) 9 xxxx-xxxx"
                                />

                            </div>

                            <div className="space-y-4">
                                <Label>Endereço</Label>

                                <CepField
                                    value={endereco.cep ?? ''}
                                    onChange={(v: string) => setEndereco(prev => ({ ...prev, cep: v }))}
                                    onAddress={(addr: any) => setEndereco(prev => ({
                                        ...prev,
                                        cep: addr.cep ?? prev.cep,
                                        logradouro: addr.logradouro ?? prev.logradouro,
                                        complemento: addr.complemento ?? prev.complemento,
                                        numero: addr.numero ?? prev.numero,
                                        bairro: addr.bairro ?? prev.bairro,
                                        cidade: addr.cidade ?? prev.cidade,
                                        uf: addr.estado ?? prev.uf,
                                    }))}
                                    error={errors['endereco.cep']?.[0] ?? undefined}
                                />

                                <TextField id="logradouro" name="logradouro" label="Logradouro" value={endereco.logradouro ?? ''} onChange={handleChange} required />
                                <TextField id="complemento" name="complemento" label="Complemento" value={endereco.complemento ?? ''} onChange={handleChange} />
                                <TextField id="numero" name="numero" label="Número" value={endereco.numero ?? ''} onChange={handleChange} required />
                                <TextField id="bairro" name="bairro" label="Bairro" value={endereco.bairro ?? ''} onChange={handleChange} />
                                <TextField id="cidade" name="cidade" label="Cidade" value={endereco.cidade ?? ''} onChange={handleChange} required />
                                <TextField id="estado" name="estado" label="UF" value={endereco.uf ?? ''} onChange={handleChange} required maxLength={2} placeholder="PR" />
                            </div>

                            <div>
                                <Label>Experiência com Animais</Label>
                                <Textarea name="experiencia" value={experiencia} onChange={handleChange} rows={4} />
                                {errors.experiencia && <p className="text-sm text-destructive mt-1">{errors.experiencia.join(', ')}</p>}
                            </div>

                            <div>
                                <Label>Coloque imagens da sua residência</Label>

                                {existingImages.length > 0 && (
                                    <div className="flex flex-wrap gap-3 my-3">
                                        {existingImages.map((img, idx) => {
                                            const kept = !removedExistingFileNames.includes(filenameFromPath(img.caminho))
                                            return (
                                                <div key={idx} className="w-40 border rounded-md overflow-hidden">
                                                    <img src={img.caminho} alt={img.nome_original ?? `img-${idx}`} className="w-full h-28 object-cover" />
                                                    <div className="p-2 flex items-center justify-between">
                                                        <span className="text-xs truncate">{img.nome_original ?? filenameFromPath(img.caminho)}</span>
                                                        <Button type="button" onClick={() => toggleKeepExistingImage(img)} className={`text-xs ${kept ? 'bg-emerald-600' : 'bg-red-600'} px-2 py-1`}>
                                                            {kept ? 'Manter' : 'Remover'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                <div className="rounded-lg border border-dashed border-border bg-background/50 p-4">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/webp"
                                        multiple
                                        onChange={e => handleFilesAdd(e.target.files)}
                                        className="w-full text-sm text-muted-foreground file:border-0 file:bg-transparent file:text-primary cursor-pointer"
                                    />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Arraste ou selecione imagens (jpeg, png, webp) — até 10MB cada
                                    </p>

                                    {previews.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {previews.map((p, i) => (
                                                <div key={i} className="relative rounded-md overflow-hidden border bg-muted">
                                                    <img src={p.url} alt={p.name} className="w-32 h-32 object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewFile(i)}
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

                                {errors['imagens'] && <p className="text-sm text-destructive mt-2">{(errors['imagens'] as any).join?.(', ')}</p>}
                            </div>

                            {errors.global && <div className="text-sm text-destructive">{errors.global.join(', ')}</div>}

                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}</Button>
                                <Button variant="secondary" type="button" onClick={() => {
                                    if (initialData) {
                                        setNome(initialData.nome ?? '')
                                        setDataNascimento(initialData.data_nascimento ?? '')
                                        setTelefone(initialData.telefone ?? '')
                                        setSituacao((initialData.situacao as any) ?? 'ativo')
                                        setExperiencia(initialData.experiencia ?? '')
                                        setEndereco(initialData.endereco ?? {})
                                        setExistingImages(initialData.imagens ?? [])
                                        setNewFiles([])
                                        setRemovedExistingFileNames([])
                                    } else {
                                        setNome(''), setDataNascimento(''), setTelefone(''), setSituacao('inativo'), setExperiencia(''),
                                            setEndereco({}), setExistingImages([]), setNewFiles([]), setRemovedExistingFileNames([])
                                    }
                                    setErrors({})
                                }}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
        </NotToken>
    )
}
