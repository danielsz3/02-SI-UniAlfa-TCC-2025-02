import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Navbar fixa no topo */}
          <Navbar />

          <main className="min-h-screen">
            {children}
          </main>

          <Footer />

        </ThemeProvider>
      </body>
    </html >
  )
}
