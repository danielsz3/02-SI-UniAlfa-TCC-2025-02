"use client"

import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ImageCarousel from "@/components/ImageCarousel"
import { calcularIdade } from "@/lib/animal-utils"
import { LarTemporario } from "@/types"
import LoadMoreList from "@/components/LoadMoreList"

// ==============================
// TYPES
// ==============================
interface Parceiro {
  id: number
  nome: string
  descricao?: string | null
  url_site?: string | null
  imagem?: string | null
}

// ==============================
// COMPONENTE ParceiroCard
// ==============================
function ParceiroCard({ parceiro }: { parceiro: Parceiro }) {
  const storageUrl =
    process.env.NEXT_PUBLIC_STORAGE_URL ??
    "http://127.0.0.1:8000/api/imagens"

  const imagemUrl = parceiro.imagem
    ? `${storageUrl}/${parceiro.imagem}`
    : null

  const content = (
    <Card className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex flex-col h-full">
        {/* FOTO */}
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

          {/* Anel em volta da foto no hover */}
          <div className="pointer-events-none absolute inset-0 rounded-t-xl ring-0 ring-primary/0 transition-all duration-300 group-hover:ring-4 group-hover:ring-primary/60" />
        </div>

        {/* CONTEÚDO */}
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

// ==============================
// PÁGINA PRINCIPAL
// ==============================
export default function AboutPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <div className="max-w-3xl w-full">
        {/* ====================== */}
        {/* QUEM SOMOS */}
        {/* ====================== */}
        <section className="mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/3 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
            <img
              src="https://ilfattoalimentare.it/wp-content/uploads/2020/12/AdobeStock_211878265.jpeg"
              alt="Quem Somos"
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
          <p className="w-full md:w-2/3 text-lg leading-relaxed text-gray-700 dark:text-gray-300 flex flex-col justify-center space-y-2">
            <span>Página destinada à adoção responsável</span>
            <span>🚫 Não recolhemos animais</span>
            <span>⚠️ Projeto Independente</span>
            <span>🐾 Adote e mude uma vida 😸</span>
            <span>📍 Umuarama/PR</span>
            <span>CNPJ 61.706.437/0001-30</span>
          </p>
        </section>

        <Separator className="my-8" />

        {/* ====================== */}
        {/* LARES TEMPORÁRIOS */}
        {/* ====================== */}
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

        {/* ====================== */}
        {/* SEÇÃO PARCEIROS */}
        {/* ====================== */}
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
