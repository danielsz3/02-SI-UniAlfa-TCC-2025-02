"use client"

import Link from "next/link"
import { Instagram, Github, Mail } from "lucide-react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-12">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PetAffinity" width={32} height={32} />
            <span className="text-xl font-semibold tracking-tight">PetAffinity</span>
          </div>
          </Link>

          {/* Social Icons */}
          <div className="mt-3 flex items-center gap-5 text-muted-foreground">
            <a
              href="https://instagram.com/petaffinityoficial"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="transition-all hover:text-primary hover:scale-110"
            >
              <Instagram className="h-5 w-5" />
            </a>

            <a
              href="https://github.com/danielsz3/02-SI-UniAlfa-TCC-2025-02"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="transition-all hover:text-primary hover:scale-110"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 border-t" />

        {/* COLABORADORES EM CARTÕES */}
        <section className="mt-10">
          <h3 className="text-center mb-6 text-lg font-semibold text-primary">Colaboradores do Projeto</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* CARD 1 */}
            <Card className="transition-all hover:scale-105 hover:shadow-xl hover:border-primary/40">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                
                {/* Avatar GitHub */}
                <Image
                  src="https://github.com/danielsz3.png"
                  width={80}
                  height={80}
                  alt="Perfil GitHub"
                  className="rounded-full border shadow-sm"
                />

                <div>
                  <p className="font-semibold text-base tracking-tight">Daniel Mesquita Oliveira</p>
                  <p className="text-xs text-muted-foreground">RA: 14044</p>
                </div>

                <a
                  href="https://github.com/danielsz3"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </CardContent>
            </Card>

            {/* CARD 2 */}
            <Card className="transition-all hover:scale-105 hover:shadow-xl hover:border-primary/40">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <Image
                  src="https://github.com/flpgustavo.png"
                  width={80}
                  height={80}
                  alt="Perfil GitHub"
                  className="rounded-full border shadow-sm"
                />

                <div>
                  <p className="font-semibold text-base tracking-tight">Felipe Gustavo Ferreira Cruz</p>
                  <p className="text-xs text-muted-foreground">RA: 13663</p>
                </div>

                <a
                  href="https://github.com/flpgustavo"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </CardContent>
            </Card>

            {/* CARD 3 */}
            <Card className="transition-all hover:scale-105 hover:shadow-xl hover:border-primary/40">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <Image
                  src="https://github.com/JoaoGabryel.png"
                  width={80}
                  height={80}
                  alt="Perfil GitHub"
                  className="rounded-full border shadow-sm"
                />
                <div>
                  <p className="font-semibold text-base tracking-tight">João Gabryel Dos Santos Lima</p>
                  <p className="text-xs text-muted-foreground">RA: 13459</p>
                </div>

                <a
                  href="https://github.com/JoaoGabryel"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Bottom */}
        <div className="mt-10 border-t" />
        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} PetAffinity. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
