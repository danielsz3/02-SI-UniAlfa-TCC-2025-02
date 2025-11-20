import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Imagens, LarTemporario } from "@/types"
import ImageCarousel from "@/components/ImageCarousel"
import { calcularIdade } from "@/lib/animal-utils"

async function fetchLares(): Promise<LarTemporario[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lares-temporarios`, {
      cache: "no-store",
    })
    if (!res.ok) {
      throw new Error("Falha ao buscar lares temporários")
    }
    const lares = await res.json()

    return lares
  } catch (error) {
    console.error(error)
    return []
  }
}

export default async function AboutPage() {
  const lares = await fetchLares()

  return (
    <>
      <main className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
        <div className="max-w-3xl w-full">
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

          <h2 className="text-2xl font-semibold mb-6 text-center">Lares Temporários</h2>

          <section className="flex flex-col gap-4">
            {lares.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Nenhum lar temporário encontrado.
              </p>
            )}
            {lares.map((lar) => (
              <Card key={lar.id} className="flex items-center space-x-4 p-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm">
                <div className="rounded-lg overflow-hidden w-50 h-50">
                  <ImageCarousel images={lar.imagens} alt={lar.nome} variant="minimal" showArrows />
                </div>
                <CardContent className="pt-5">
                  <CardTitle className="text-xl font-bold mb-2">{lar.nome}</CardTitle>
                    <div className="text-md font-medium mb-1">
                      {lar.endereco.logradouro}, {lar.endereco.bairro}, {lar.endereco.cidade} - {lar.endereco.uf} - CEP: {lar.endereco.cep}
                    </div>
                    <div className="text-md text-secondary font-semibold mb-1">Ativo há {calcularIdade(lar.updated_at)}</div>
                    <div className="text-md font-thin">Lar de {lar.animais.filter((animal) => animal.situacao != 'adotado').length} animais</div>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </main>
    </>
  )
}
