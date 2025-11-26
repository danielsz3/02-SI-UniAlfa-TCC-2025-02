import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full border-b bg-background/80 backdrop-blur-md z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        
        <Link href="/">
        <h1 className="text-xl font-bold text-black dark:text-white">PetAffinity</h1>
        </Link>
        
        <nav className="flex-1 flex justify-center space-x-8 text-sm font-medium">
          <Link href="/adotar" className="hover:text-primary/80">
            ADOTAR
          </Link>
          <Link href="/doar" className="hover:text-primary/80">
            DOAR
          </Link>
          <Link href="/sobre" className="hover:text-primary/80">
            SOBRE
          </Link>
        </nav>

        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
