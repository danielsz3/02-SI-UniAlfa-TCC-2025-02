import "./globals.css"
import type { Metadata } from "next"
import Providers from "@/components/Providers"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "PetAffinity",
  description: "Next + Tailwind + shadcn",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <Navbar />

          <main className="min-h-screen">
            {children}
          </main>
          <Toaster position="top-center" closeButton />
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
