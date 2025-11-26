import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Animal {
  id: number;
  nome: string;
  idade: string;
  raca: string;
  cidade: string;
  dataCadastro: string;
  imagemUrl?: string;
}

async function fetchAnimais(): Promise<Animal[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/animais`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Falha ao buscar animais");
    }
    const animais = await res.json();

    // Ajuste os campos conforme sua API
    return animais.map((animal: any) => ({
      id: animal.id,
      nome: animal.nome,
      idade: animal.idade || "Desconhecida",
      raca: animal.raca || "Desconhecida",
      cidade: animal.cidade || "Desconhecida",
      dataCadastro: animal.created_at ? new Date(animal.created_at).toLocaleDateString("pt-BR") : "",
      imagemUrl: animal.imagem_url || null,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function AdotarPage() {
  const animais = await fetchAnimais();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background px-4 py-10 container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Animais Para Adoção</h1>

        {animais.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Nenhum animal disponível para adoção no momento.</p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {animais.map((animal) => (
              <Card key={animal.id} className="flex flex-col">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-md overflow-hidden">
                  {animal.imagemUrl ? (
                    <img
                      src={animal.imagemUrl}
                      alt={animal.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Idade: {animal.idade}</p>
                  <CardTitle className="mb-1">{animal.nome}</CardTitle>
                  <CardDescription className="mb-1">Raça: {animal.raca}</CardDescription>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cidade: {animal.cidade}</p>
                </CardContent>
                <CardFooter className="flex flex-col items-start">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{animal.dataCadastro}</p>
                  <Button className="w-full">Adotar</Button>
                </CardFooter>
              </Card>
            ))}
          </section>
        )}

        <Separator className="mt-10" />
        {/* Rodapé pode ser adicionado aqui */}
      </main>
    </>
  );
}
