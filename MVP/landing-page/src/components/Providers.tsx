"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider } from "next-themes"
import { useRouter } from "next/navigation"
import { GoogleOAuthProvider } from "@react-oauth/google"

type User = any | null

type AuthContextType = {
  user: User
  login: (userObj: any, token?: string, redirectTo?: string) => void
  logout: (redirectTo?: string) => void
  refreshUserFromStorage: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within Providers")
  return ctx
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const router = useRouter()

  const camposObrigatorios = ["cpf", "data_nascimento", "telefone"]

  function verificarCadastroIncompleto(u: any) {
    if (!u) return false
    return camposObrigatorios.some(c => !u[c] || u[c] === "")
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      const parsed = raw ? JSON.parse(raw) : null
      setUser(parsed)

      if (parsed && verificarCadastroIncompleto(parsed)) {
        if (!window.location.pathname.startsWith("/perfil/editar")) {
          router.replace("/perfil/editar")
        }
      }
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const onLogin = e => {
      const detail = e.detail
      if (detail) {
        setUser(detail)
        localStorage.setItem("user", JSON.stringify(detail))

        if (verificarCadastroIncompleto(detail)) {
          router.replace("/perfil/editar")
          return
        }

        router.replace("/")
      } else {
        const raw = localStorage.getItem("user")
        setUser(raw ? JSON.parse(raw) : null)
      }
    }

    const onLogout = () => {
      setUser(null)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      router.replace("/login")
    }

    window.addEventListener("auth:login", onLogin)
    window.addEventListener("auth:logout", onLogout)

    return () => {
      window.removeEventListener("auth:login", onLogin)
      window.removeEventListener("auth:logout", onLogout)
    }
  }, [])

  function refreshUserFromStorage() {
    try {
      const raw = localStorage.getItem("user")
      const parsed = raw ? JSON.parse(raw) : null
      setUser(parsed)

      if (parsed && verificarCadastroIncompleto(parsed)) {
        router.replace("/perfil/editar")
      }
    } catch {
      setUser(null)
    }
  }

  function login(userObj: any, token?: string, redirectTo = "/") {
    if (token) localStorage.setItem("token", token)
    if (userObj) localStorage.setItem("user", JSON.stringify(userObj))
    setUser(userObj ?? null)

    window.dispatchEvent(new CustomEvent("auth:login", { detail: userObj }))

    if (verificarCadastroIncompleto(userObj)) {
      router.replace("/perfil/editar")
      return
    }

    router.replace(redirectTo)
  }

  function logout(redirectTo = "/login") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    window.dispatchEvent(new CustomEvent("auth:logout"))
    router.replace(redirectTo)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUserFromStorage }}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  )
}
