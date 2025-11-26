import "./globals.css"
import { ThemeProvider } from "next-themes"
import type { Metadata } from "next"
import { ThemeToggle } from "@/components/theme-toggle"
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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <html lang="pt-BR" suppressHydrationWarning
        className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
        <body>
          <ThemeToggle />
          {children}
        </body>
      </html>
    </ThemeProvider>
  )
}
