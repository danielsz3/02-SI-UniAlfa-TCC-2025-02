"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || ""; // ou use o param da rota

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  // Validar token ao carregar a página
  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validate-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) throw new Error("Token inválido ou expirado");

        setValidToken(true);
      } catch (err: any) {
        setError(err.message);
      }
    }

    if (token) validateToken();
    else setError("Token não fornecido");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao redefinir senha");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
              Senha redefinida com sucesso!
            </h2>
            <Link href="/login" className="text-primary font-medium hover:underline">
              Voltar para login
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
            Redefinir Senha
          </h2>

          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          {validToken ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite a nova senha"
                />
              </div>
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Confirme a nova senha
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  required
                  minLength={6}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Confirme a nova senha"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </form>
          ) : (
            !error && <p className="text-center">Validando token...</p>
          )}
        </div>
      </main>
    </>
  );
}
