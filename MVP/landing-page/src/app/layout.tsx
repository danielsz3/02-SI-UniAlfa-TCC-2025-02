import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import Providers from "@/components/Providers"
import { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

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
          <Toaster position="top-center" />
          <Footer/>
        </Providers>
      </body>
    </html>
  )
}
