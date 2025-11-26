import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">🚀 Bem-vindo ao Projeto</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Este é um teste inicial da integração entre
            <span className="font-semibold"> Next.js, TailwindCSS</span> e
            <span className="font-semibold"> shadcn/ui</span>.
          </p>
          <Button size="lg">Começar Agora</Button>
        </div>
      </main>
    </>
  )
}
