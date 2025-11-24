"use client"

import { useEffect, useState } from "react"

interface Ong {
  id: number
  nome: string
  descricao?: string | null
  imagem?: string | null

  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null

  cnpj?: string | null
  razao_social?: string | null

  banco?: string | null
  agencia?: string | null
  numero_conta?: string | null
  tipo_conta?: "corrente" | "poupança" | string | null
  chave_pix?: string | null
}

export default function DoarPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL

  const [ong, setOng] = useState<Ong | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiBase) return

    const fetchOng = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${apiBase}/ongs/1`)
        if (!res.ok) {
          throw new Error(`Erro ao buscar ONG: ${res.statusText}`)
        }

        const data: Ong = await res.json()
        setOng(data)
      } catch (err: any) {
        setError(err.message ?? "Erro ao carregar dados da ONG")
      } finally {
        setLoading(false)
      }
    }

    fetchOng()
  }, [apiBase])

  const imagemCapaUrl =
    ong?.imagem && !ong.imagem.startsWith("http")
      ? `${storageUrl}/${ong.imagem}`
      : ong?.imagem ?? null

  const qrCodeUrl = "/qrcode-pix.png"

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-3xl font-bold mb-8">Ajude na causa</h1>

        <div className="mx-auto mb-6 max-w-full">
          {loading ? (
            <div className="w-full h-64 flex items-center justify-center text-sm text-muted-foreground rounded-md border border-dashed">
              Carregando imagem da ONG...
            </div>
          ) : imagemCapaUrl ? (
            <img
              src={imagemCapaUrl}
              alt={ong?.nome ?? "ONG"}
              className="mx-auto max-w-full h-auto rounded-md shadow-md object-cover"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-sm text-muted-foreground rounded-md border border-dashed">
              Sem imagem de capa cadastrada
            </div>
          )}
        </div>

        <p className="mb-10 text-gray-700 dark:text-gray-300 text-lg">
          Contribua com uma doação para ajudar os animais em situação de abandono.
        </p>

        {loading && (
          <div className="text-muted-foreground mb-6">
            Carregando informações bancárias...
          </div>
        )}

        {error && (
          <div className="text-destructive mb-6">{error}</div>
        )}

        {!loading && ong && (
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">

            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 w-72 shadow-lg">
              <img
                src={qrCodeUrl}
                alt="QR Code Pix"
                className="mx-auto w-64 h-64 object-contain"
              />
              <div className="text-center text-sm font-semibold mt-4">
                <p className="mb-1">Chave Pix</p>

                {ong.chave_pix ? (
                  <p className="mt-1 wrap-break-word">{ong.chave_pix}</p>
                ) : ong.cnpj ? (
                  <>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="mt-1">{ong.cnpj}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground mt-2">
                    Chave Pix não cadastrada
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 w-72 shadow-lg text-left text-sm font-semibold">
              <p className="mb-4 font-bold text-lg">Dados Bancários</p>

              {ong.banco || ong.agencia || ong.numero_conta || ong.tipo_conta ? (
                <>
                  {ong.banco && (
                    <p className="mb-2">
                      <strong>Banco:</strong> {ong.banco}
                    </p>
                  )}
                  {ong.agencia && (
                    <p className="mb-2">
                      <strong>Agência:</strong> {ong.agencia}
                    </p>
                  )}
                  {ong.numero_conta && (
                    <p className="mb-2">
                      <strong>Número da Conta:</strong> {ong.numero_conta}
                    </p>
                  )}
                  {ong.tipo_conta && (
                    <p className="mb-2 capitalize">
                      <strong>Tipo:</strong>{" "}
                      {ong.tipo_conta === "corrente"
                        ? "Conta Corrente"
                        : ong.tipo_conta === "poupança"
                          ? "Conta Poupança"
                          : ong.tipo_conta}
                    </p>
                  )}

                  {ong.razao_social && (
                    <p className="mt-4 text-xs font-normal text-muted-foreground">
                      Titular: {ong.razao_social}
                    </p>
                  )}
                  {ong.cnpj && (
                    <p className="text-xs font-normal text-muted-foreground">
                      CNPJ: {ong.cnpj}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Dados bancários não cadastrados.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
