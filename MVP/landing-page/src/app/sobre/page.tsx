"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ImageCarousel from "@/components/ImageCarousel"
import { calcularIdade } from "@/lib/animal-utils"
import { LarTemporario } from "@/types"
import LoadMoreList from "@/components/LoadMoreList"

interface Ong {
  id: number
  nome: string
  descricao?: string | null
  imagem?: string | null
  cnpj?: string | null
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  cep?: string | null
  contatos?: Array<{
    id: number
    tipo: string
    contato: string
    link?: string | null
    descricao?: string | null
  }>
}

interface Parceiro {
  id: number
  nome: string
  descricao?: string | null
  url_site?: string | null
  imagem?: string | null
}

function ParceiroCard({ parceiro }: { parceiro: Parceiro }) {
  const storageUrl =
    process.env.NEXT_PUBLIC_STORAGE_URL

  const imagemUrl = parceiro.imagem ? `${storageUrl}/${parceiro.imagem}` : null

  const content = (
    <Card className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex flex-col h-full">
        <div className="relative w-full overflow-hidden">
          <div className="relative aspect-4/3 w-full">
            {imagemUrl ? (
              <img
                src={imagemUrl}
                alt={parceiro.nome}
                className="h-full w-full object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                <svg
                  className="h-16 w-16 text-slate-400 dark:text-slate-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-t-xl ring-0 ring-primary/0 transition-all duration-300 group-hover:ring-4 group-hover:ring-primary/60" />
        </div>

        <CardContent className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="text-lg font-semibold tracking-tight line-clamp-1">
            {parceiro.nome}
          </h3>

          {parceiro.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {parceiro.descricao}
            </p>
          )}

          {parceiro.url_site && (
            <p className="mt-1 text-xs font-medium text-primary/80 group-hover:text-primary">
              {(() => {
                try {
                  return new URL(parceiro.url_site).hostname
                } catch {
                  return parceiro.url_site
                }
              })()}
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  )

  if (parceiro.url_site) {
    return (
      <a
        href={parceiro.url_site}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    )
  }

  return content
}

export default function AboutPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL
  const storageUrl =
    process.env.NEXT_PUBLIC_STORAGE_URL

  const [ong, setOng] = useState<Ong | null>(null)
  const [loadingOng, setLoadingOng] = useState(true)
  const [errorOng, setErrorOng] = useState<string | null>(null)

  useEffect(() => {
    if (!apiBase) return

    const fetchOng = async () => {
      try {
        setLoadingOng(true)
        setErrorOng(null)

        const res = await fetch(`${apiBase}/ongs/1`)
        if (!res.ok) {
          throw new Error(`Erro ao buscar ONG: ${res.statusText}`)
        }

        const data: Ong = await res.json()
        setOng(data)
      } catch (err: any) {
        setErrorOng(err.message ?? "Erro ao carregar dados da ONG")
      } finally {
        setLoadingOng(false)
      }
    }

    fetchOng()
  }, [apiBase])

  const imagemOngUrl =
    ong?.imagem && !ong.imagem.startsWith("http")
      ? `${storageUrl}/${ong.imagem}`
      : ong?.imagem ?? null

  const enderecoFormatado =
    ong &&
      (ong.logradouro ||
        ong.numero ||
        ong.bairro ||
        ong.cidade ||
        ong.uf ||
        ong.cep)
      ? [
        [ong.logradouro, ong.numero].filter(Boolean).join(", "),
        [ong.bairro, ong.cidade].filter(Boolean).join(" - "),
        ong.uf,
        ong.cep && `CEP: ${ong.cep}`,
      ]
        .filter(Boolean)
        .join(" | ")
      : null

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <div className="max-w-3xl w-full">
        <section className="mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/3 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
            {loadingOng ? (
              <div className="w-full h-48 flex items-center justify-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : imagemOngUrl ? (
              <img
                src={imagemOngUrl}
                alt={ong?.nome ?? "ONG"}
                className="w-full h-auto object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-sm text-muted-foreground">
                Sem imagem da ONG
              </div>
            )}
          </div>

          <div className="w-full md:w-2/3 text-lg leading-relaxed text-gray-700 dark:text-gray-300 flex flex-col justify-center space-y-2">
            {loadingOng && (
              <span className="text-sm text-muted-foreground">
                Carregando informações da ONG...
              </span>
            )}

            {errorOng && (
              <span className="text-sm text-destructive">{errorOng}</span>
            )}

            {ong && (
              <>
                <span className="font-semibold text-xl">{ong.nome}</span>

                {ong.descricao && <span>{ong.descricao}</span>}

                {enderecoFormatado && (
                  <span className="text-sm text-muted-foreground">
                    {enderecoFormatado}
                  </span>
                )}

                {ong.cnpj && (
                  <span className="text-sm text-muted-foreground">
                    CNPJ {ong.cnpj}
                  </span>
                )}

                {ong.contatos && ong.contatos.length > 0 && (
                  <div className="pt-2 space-y-1 text-sm">
                    {ong.contatos.map((c, index) => (
                      <div key={c.id ?? index}>
                        <strong className="capitalize">{c.tipo}:</strong>{" "}
                        {c.link ? (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {c.contato}
                          </a>
                        ) : (
                          c.contato
                        )}
                        {c.descricao && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({c.descricao})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

          <Separator className="my-8" />

          <h2 className="text-2xl font-semibold mb-6 text-center">
            Lares Temporários
          </h2>
          <section className="flex flex-col gap-4">
            <LoadMoreList
              url={`${apiBase}/lares-temporarios`}
              step={4}
              className="space-y-4"
              renderItem={(lar: LarTemporario) => (
                <Card
                  key={lar.id}
                  className="flex flex-col md:flex-row items-center md:items-start md:space-x-4 p-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
                >
                  <div className="rounded-lg overflow-hidden w-full md:w-48 h-48 mb-4 md:mb-0">
                    <ImageCarousel
                      images={lar.imagens}
                      alt={lar.nome}
                      variant="minimal"
                      showArrows
                    />
                  </div>

                  <CardContent className="pt-0 md:pt-5 w-full">
                    <CardTitle className="text-xl font-bold mb-2">
                      {lar.nome}
                    </CardTitle>
                    <div className="text-sm font-medium">
                      {lar.endereco.logradouro}, {lar.endereco.bairro},{" "}
                      {lar.endereco.cidade} - {lar.endereco.uf}
                    </div>
                    <div className="text-sm font-medium mb-1">
                      CEP: {lar.endereco.cep}
                    </div>

                    <div className="text-md text-secondary font-semibold mb-1">
                      Ativo há {calcularIdade(lar.updated_at)}
                    </div>

                    <div className="text-md font-thin">
                      Lar de{" "}
                      {
                        lar.animais.filter(
                          (a) => a.situacao !== "adotado",
                        ).length
                      }{" "}
                      animais atualmente
                    </div>
                    <div className="text-md font-thin">
                      Já passaram mais de{" "}
                      {
                        lar.animais.filter(
                          (a) => a.situacao === "adotado",
                        ).length
                      }{" "}
                      animais neste lar
                    </div>
                  </CardContent>
                </Card>
              )}
            />
          </section>
          
          <Separator className="my-12" />

          <h2 className="text-2xl font-semibold mb-6 text-center">
            Parceiros
          </h2>

          <LoadMoreList
            url={`${apiBase}/parceiros`}
            step={6}
            renderItem={(p: Parceiro) => <ParceiroCard key={p.id} parceiro={p} />}
          />
        </div>
      </main>
    )
  }
