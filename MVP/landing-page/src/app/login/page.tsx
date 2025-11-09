"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/components/Providers"
import { FcGoogle } from "react-icons/fc"
import { useGoogleLogin } from "@react-oauth/google"

export default function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || "Erro ao fazer login")
      }

      const token = data.access_token
      const user = data.user

      if (!token) throw new Error("Token não recebido")

      login(user, token, "/")
    } catch (err: any) {
      setError(err?.message ?? "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: tokenResponse.access_token }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || data.error || "Erro no login com Google")
        }

        const token = data.access_token
        const user = data.user

        if (!token) throw new Error("Token não recebido")

        login(user, token, "/")
      } catch (err: any) {
        setError(err?.message ?? "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError("Erro ao autenticar com Google")
    },
  })

  return (
    <>
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
            Entrar
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Sua senha"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <div className="flex items-center gap-3 my-6">
              <hr className="grow border-gray-300 dark:border-gray-600" />
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Ou, continue com:
              </span>
              <hr className="grow border-gray-300 dark:border-gray-600" />
            </div>

            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                aria-label="Entrar com Google"
                className="google-auth-button"
              >
                <FcGoogle size={28} />
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="flex justify-center">
              <Link
                href="/reset-password"
                className="text-sm text-primary hover:underline mt-2"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div >
      </main >
    </>
  )
}
