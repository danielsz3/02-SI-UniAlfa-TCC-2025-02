"use client"

import Link from "next/link"
import { Instagram, Facebook, Github, Mail } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-12">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PetAffinity" width={32} height={32} />
            <span className="text-xl font-semibold tracking-tight">PetAffinity</span>
          </div>

          {/* Social */}
          <div className="mt-2 flex items-center gap-4 text-muted-foreground">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="transition-colors hover:text-primary"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="transition-colors hover:text-primary"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="transition-colors hover:text-primary"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="mailto:contato@petaffinity.com"
              aria-label="E-mail"
              className="transition-colors hover:text-primary"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          {/* Links */}
          <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <Link href="/ongs" className="transition-colors hover:text-primary">
              ONG
            </Link>
            <Link href="/colaboradores" className="transition-colors hover:text-primary">
              Colaboradores
            </Link>
            <Link href="/termos" className="transition-colors hover:text-primary">
              Termos e Condições
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t" />

        {/* Copyright */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} PetAffinity. Todos os direitos reservados.</p>
          <p className="hidden md:block">Feito com ❤️ pela comunidade.</p>
        </div>
      </div>
    </footer>
  )
}
