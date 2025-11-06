"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type RoutineOption =
  | "home_office"
  | "ninguem_fica_em_casa_dia"
  | "gente_em_casa_dia"
  | "muitas_visitas"
  | "eventos_frequentes"
  | "ruidos_vizinhanca"

const routineOptions: { key: RoutineOption; label: string }[] = [
  { key: "home_office", label: "Trabalho em home office" },
  { key: "ninguem_fica_em_casa_dia", label: "Não fica ninguém em casa durante o dia" },
  { key: "gente_em_casa_dia", label: "Fica gente em casa durante o dia" },
  { key: "muitas_visitas", label: "Recebo muitas visitas" },
  { key: "eventos_frequentes", label: "Faço eventos com alta frequência" },
  { key: "ruidos_vizinhanca", label: "Há fogos/ruídos sensíveis na vizinhança" },
]

export default function AdocaoFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const animalIdParam = searchParams.get("animal_id") ?? ""
  const [animalId, setAnimalId] = useState<string>(animalIdParam)

  const [animalName, setAnimalName] = useState<string | null>(null)
  const [loadingAnimal, setLoadingAnimal] = useState(false)

  const [step, setStep] = useState<number>(1)

  const [qtdPessoasCasa, setQtdPessoasCasa] = useState<string>("")
  const [possuiFilhos, setPossuiFilhos] = useState<string>("")
  const [sobreRotina, setSobreRotina] = useState<RoutineOption[]>([])
  const [acessoRuaJanelas, setAcessoRuaJanelas] = useState<string>("")
  const [acessoRuaPortoesMuros, setAcessoRuaPortoesMuros] = useState<string>("")
  const [rendaFamiliar, setRendaFamiliar] = useState<string>("")
  const [aceitaTermos, setAceitaTermos] = useState<boolean>(false)

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

  useEffect(() => {
    if (!animalId) {
      setAnimalName(null)
      return
    }
    let mounted = true
    setLoadingAnimal(true)
    fetch(`${apiBase}/animais/${animalId}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (!mounted) return
        if (!res.ok) {
          setAnimalName(null)
          return
        }
        const json = await res.json()
        setAnimalName(json.nome ?? `${json.tipo_animal ?? "Animal"} #${json.id}`)
      })
      .catch(() => {
        if (!mounted) return
        setAnimalName(null)
      })
      .finally(() => mounted && setLoadingAnimal(false))
    return () => { mounted = false }
  }, [animalId, apiBase])

  const goNext = useCallback(() => setStep((s) => Math.min(3, s + 1)), [])
  const goPrev = useCallback(() => setStep((s) => Math.max(1, s - 1)), [])

  const toggleRoutine = (key: RoutineOption) => {
    setSobreRotina((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]))
  }

  function validateStep(s: number) {
    const errors: Record<string, string> = {}
    if (s === 1) {
      if (!qtdPessoasCasa) errors.qtdPessoasCasa = "Informe com quantas pessoas mora."
      if (possuiFilhos !== "true" && possuiFilhos !== "false") errors.possuiFilhos = "Informe se possui filhos."
      if (!sobreRotina || sobreRotina.length === 0) errors.sobreRotina = "Selecione ao menos uma opção sobre sua rotina."
    }
    if (s === 2) {
      if (!acessoRuaJanelas) errors.acessoRuaJanelas = "Informe sobre o acesso à rua pelas janelas."
      if (!acessoRuaPortoesMuros) errors.acessoRuaPortoesMuros = "Informe sobre portões e muros."
    }
    if (s === 3) {
      if (!rendaFamiliar) errors.rendaFamiliar = "Informe a renda familiar."
      if (!aceitaTermos) errors.aceitaTermos = "Você precisa aceitar os termos."
    }
    return errors
  }

  function handleNext() {
    const errs = validateStep(step)
    setValidationErrors(Object.keys(errs).length ? { [step as any]: Object.values(errs) } : {})
    if (Object.keys(errs).length === 0) goNext()
  }

  function handlePrev() {
    setValidationErrors({})
    goPrev()
  }

  // Recupera token armazenado no localStorage (trata JSON ou string)
  const getTokenFromStorage = () => {
    if (typeof window === "undefined") return null
    const keysToTry = ["token", "access_token", "authToken", "jwt"]
    let raw: string | null = null
    for (const k of keysToTry) {
      raw = localStorage.getItem(k)
      if (raw) break
    }
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed?.access_token || parsed?.token || parsed?.jwt || raw
    } catch {
      return raw
    }
  }

  // Decodifica JWT (payload) e retorna objeto (unsafe client-side: só para extrair o ID)
  const parseJwtPayload = (token: string | null) => {
    if (!token) return null
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const json = decodeURIComponent(
        atob(payloadB64)
          .split('')
          .map(function(c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2) })
          .join('')
      )
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  // montagem do payload conforme controller espera (agora inclui usuario_id extraído do token)
  const buildPayload = (usuarioId?: number | null) => {
    const payload: any = {
      animal_id: Number(animalId),
      qtd_pessoas_casa: qtdPessoasCasa,
      possui_filhos: possuiFilhos === "true",
      sobre_rotina: sobreRotina,
      acesso_rua_janelas: acessoRuaJanelas,
      acesso_rua_portoes_muros: acessoRuaPortoesMuros,
      renda_familiar: rendaFamiliar,
      aceita_termos: aceitaTermos ? "1" : "0",
    }
    if (usuarioId != null && !Number.isNaN(usuarioId)) payload.usuario_id = Number(usuarioId)
    return payload
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setErrorMessage(null)
    setValidationErrors({})
    const errorsAll = { ...validateStep(1), ...validateStep(2), ...validateStep(3) }
    if (Object.keys(errorsAll).length) {
      setValidationErrors({ form: Object.values(errorsAll) })
      if (errorsAll.qtdPessoasCasa || errorsAll.possuiFilhos || errorsAll.sobreRotina) setStep(1)
      else if (errorsAll.acessoRuaJanelas || errorsAll.acessoRuaPortoesMuros) setStep(2)
      else setStep(3)
      return
    }

    if (!animalId) {
      setErrorMessage("É necessário indicar qual animal você quer adotar.")
      return
    }

    setSubmitting(true)
    try {
      const token = getTokenFromStorage()

      if (!token) {
        setErrorMessage("Você precisa estar autenticado para solicitar adoção. Faça login e tente novamente.")
        setSubmitting(false)
        return
      }

      // Decodifica token para extrair id do usuário (tenta várias chaves comuns)
      const payload = parseJwtPayload(token)
      const possibleUserId = payload?.sub ?? payload?.id ?? payload?.user_id ?? payload?.usuario_id ?? payload?.id_usuario ?? null
      if (!possibleUserId) {
        setErrorMessage("Não foi possível extrair o ID do usuário do token. Verifique o token ou ajuste a extração conforme suas claims.")
        setSubmitting(false)
        return
      }
      const usuarioId = Number(possibleUserId)

      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }

      const res = await fetch(`${apiBase}/adocoes`, {
        method: "POST",
        headers,
        body: JSON.stringify(buildPayload(usuarioId)),
      })

      if (res.status === 401) {
        setErrorMessage("Você precisa estar autenticado para solicitar adoção. Faça login e tente novamente.")
        setSubmitting(false)
        return
      }

      if (res.status === 422) {
        const json = await res.json()
        setValidationErrors(json.errors || {})
        setErrorMessage("Há erros no formulário. Verifique os campos e tente novamente.")
        setSubmitting(false)
        if (json.errors) {
          if (json.errors.animal_id || json.errors.qtd_pessoas_casa || json.errors.possui_filhos || json.errors.sobre_rotina) setStep(1)
          else if (json.errors.acesso_rua_janelas || json.errors.acesso_rua_portoes_muros) setStep(2)
          else setStep(3)
        }
        return
      }

      if (!res.ok) {
        const txt = await res.text()
        setErrorMessage(txt || "Erro ao enviar solicitação de adoção.")
        setSubmitting(false)
        return
      }

      const data = await res.json()
      setSuccessMessage("Solicitação de adoção criada com sucesso!")
      setTimeout(() => { router.push(`/adotar/${animalId}`) }, 1200)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || "Erro ao enviar solicitação.")
    } finally {
      setSubmitting(false)
    }
  }

  const stepDots = useMemo(() => {
    return [1, 2, 3].map((s) => (
      <div key={s} className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${s === step ? "bg-primary" : "bg-muted"}`} />
        {s < 3 && <div className="w-24 h-1 bg-muted/60" />}
      </div>
    ))
  }, [step])

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-center text-2xl font-bold mb-4">Formulário de Adoção</h1>

        <div className="bg-card rounded-lg border text-foreground p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
              <span className="text-sm text-muted-foreground">📷</span>
            </div>
            <div>
              <div className="font-semibold">{animalName ?? "Animal"}</div>
              <div className="text-sm text-muted-foreground">Informe detalhes para a solicitação</div>
            </div>
            <div className="ml-auto text-sm">
              <Badge variant="secondary">Passo {step} de 3</Badge>
            </div>
          </div>

          <div className="flex items-center justify-center mb-4">{stepDots}</div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">1. Sobre Você, sua Família e sua Rotina</h2>

                <div>
                  <Label>Com quem você mora?</Label>
                  <RadioGroup value={qtdPessoasCasa} onValueChange={(v: string) => setQtdPessoasCasa(v)} className="grid gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="sozinho" id="qtd-sozinho" />
                      <Label htmlFor="qtd-sozinho" className="ml-2">Sozinho</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="uma_pessoa" id="qtd-uma" />
                      <Label htmlFor="qtd-uma" className="ml-2">1 pessoa</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="duas_pessoas" id="qtd-duas" />
                      <Label htmlFor="qtd-duas" className="ml-2">2 pessoas</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="tres_pessoas" id="qtd-tres" />
                      <Label htmlFor="qtd-tres" className="ml-2">3 pessoas</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="quatro_ou_mais" id="qtd-quatro" />
                      <Label htmlFor="qtd-quatro" className="ml-2">4 ou mais</Label>
                    </div>
                  </RadioGroup>
                  {validationErrors.qtdPessoasCasa && <p className="text-sm text-destructive mt-1">{validationErrors.qtdPessoasCasa.join(", ")}</p>}
                </div>

                <div>
                  <Label>Possui filhos?</Label>
                  <RadioGroup value={possuiFilhos} onValueChange={(v: string) => setPossuiFilhos(v)} className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="true" id="filhos-sim" />
                      <Label htmlFor="filhos-sim" className="ml-2">Sim</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="false" id="filhos-nao" />
                      <Label htmlFor="filhos-nao" className="ml-2">Não</Label>
                    </div>
                  </RadioGroup>
                  {validationErrors.possuiFilhos && <p className="text-sm text-destructive mt-1">{validationErrors.possuiFilhos.join(", ")}</p>}
                </div>

                <div>
                  <Label>Sobre sua rotina (marque as que se aplicam):</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {routineOptions.map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`rotina-${opt.key}`}
                          checked={sobreRotina.includes(opt.key)}
                          onCheckedChange={(checked) => {
                            const isChecked = !!checked
                            if (isChecked) setSobreRotina((p) => [...p, opt.key])
                            else setSobreRotina((p) => p.filter((k) => k !== opt.key))
                          }}
                        />
                        <Label htmlFor={`rotina-${opt.key}`} className="ml-2 text-sm">{opt.label}</Label>
                      </label>
                    ))}
                  </div>
                  {validationErrors.sobre_rotina && <p className="text-sm text-destructive mt-1">{validationErrors.sobre_rotina.join(", ")}</p>}
                </div>

                <div className="flex justify-between items-center">
                  <div />
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setAnimalId(""); router.back() }} type="button">Cancelar</Button>
                    <Button onClick={handleNext} type="button">Próximo ›</Button>
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">2. Segurança da Casa</h2>

                <div>
                  <Label>Acesso à rua - Janelas:</Label>
                  <RadioGroup value={acessoRuaJanelas} onValueChange={(v: string) => setAcessoRuaJanelas(v)} className="grid gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="janelas_telas_sem_acesso_rua" id="jan-1" />
                      <Label htmlFor="jan-1" className="ml-2">Janelas teladas, sem acesso à rua</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="janelas_sem_telas" id="jan-2" />
                      <Label htmlFor="jan-2" className="ml-2">As janelas não são teladas</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="janelas_sem_telas_instalarei" id="jan-3" />
                      <Label htmlFor="jan-3" className="ml-2">Janelas não teladas, mas pretendo instalar em breve</Label>
                    </div>
                  </RadioGroup>
                  {validationErrors.acesso_rua_janelas && <p className="text-sm text-destructive mt-1">{validationErrors.acesso_rua_janelas.join(", ")}</p>}
                </div>

                <div>
                  <Label>Acesso à rua - Portões e Muros:</Label>
                  <RadioGroup value={acessoRuaPortoesMuros} onValueChange={(v: string) => setAcessoRuaPortoesMuros(v)} className="grid gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="impedem_escape" id="pm-1" />
                      <Label htmlFor="pm-1" className="ml-2">Os portões e muros impedem o escape do animal</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="permitem_acesso_rua" id="pm-2" />
                      <Label htmlFor="pm-2" className="ml-2">Os portões e muros permitem que o animal acesse a rua</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="serao_adaptados" id="pm-3" />
                      <Label htmlFor="pm-3" className="ml-2">Portões e muros serão adaptados para impedir o acesso</Label>
                    </div>
                  </RadioGroup>
                  {validationErrors.acesso_rua_portoes_muros && <p className="text-sm text-destructive mt-1">{validationErrors.acesso_rua_portoes_muros.join(", ")}</p>}
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="ghost" onClick={handlePrev} type="button">‹ Anterior</Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setAnimalId(""); router.back() }} type="button">Cancelar</Button>
                    <Button onClick={handleNext} type="button">Próximo ›</Button>
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">3. Condições Finais e Acordo</h2>

                <div>
                  <Label>Condições Econômicas (Renda familiar mensal):</Label>
                  <RadioGroup value={rendaFamiliar} onValueChange={(v: string) => setRendaFamiliar(v)} className="grid gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="acima_2_sm" id="r-1" />
                      <Label htmlFor="r-1" className="ml-2">Acima de 2 salários mínimos</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="abaixo_2_sm" id="r-2" />
                      <Label htmlFor="r-2" className="ml-2">Abaixo de 2 salários mínimos</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="outro" id="r-3" />
                      <Label htmlFor="r-3" className="ml-2">Outro</Label>
                    </div>
                  </RadioGroup>
                  {validationErrors.renda_familiar && <p className="text-sm text-destructive mt-1">{validationErrors.renda_familiar.join(", ")}</p>}
                </div>

                <div>
                  <label className="flex items-start gap-2">
                    <Checkbox
                      id="aceita-termos"
                      checked={aceitaTermos}
                      onCheckedChange={(checked) => setAceitaTermos(!!checked)}
                    />
                    <div>
                      <div className="font-medium">Aceite e Permissão</div>
                      <div className="text-sm text-muted-foreground">Todos que moram comigo estão de acordo com a adoção.</div>
                    </div>
                  </label>
                  {validationErrors.aceita_termos && <p className="text-sm text-destructive mt-1">{validationErrors.aceita_termos.join(", ")}</p>}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <Button variant="ghost" onClick={handlePrev} type="button">‹ Anterior</Button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => { setAnimalId(""); router.back() }} type="button">Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Enviando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </form>

          <div className="mt-4">
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-2">
                {Object.entries(validationErrors).map(([k, v]) => (
                  <p key={k} className="text-sm text-destructive">{Array.isArray(v) ? v.join(" ") : v}</p>
                ))}
              </div>
            )}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Você está solicitando a adoção do animal: {animalId ? <strong>{animalId}</strong> : "Nenhum animal selecionado"}</p>
          {!animalId && (
            <p className="mt-2">
              Ou <Link href="/adotar">volte para a listagem</Link> e escolha um animal.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
