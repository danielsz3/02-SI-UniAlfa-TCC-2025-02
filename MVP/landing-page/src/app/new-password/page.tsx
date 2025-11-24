"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import NotToken from "@/components/NotToken";

function NewPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawToken = searchParams?.get("token") || "";
  const rawEmail = searchParams?.get("email") || "";
  const token = rawToken ? decodeURIComponent(rawToken) : "";
  const emailFromQuery = rawEmail ? decodeURIComponent(rawEmail) : "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [email, setEmail] = useState(emailFromQuery);

  useEffect(() => {

    if (!token) {
      setError("Token não fornecido na URL.");
      setValidToken(false);
      router.push("/reset-password")
      return;
    }
    if (!emailFromQuery) {
      setError("E-mail não fornecido na URL.");
      setValidToken(false);
      return;
    }

    setError(null);
    setValidToken(true);
  }, [token, emailFromQuery]);

  function validatePasswordClientSide(pw: string) {
    if (pw.length < 8) return "A senha deve ter ao menos 8 caracteres.";
    if (!/[A-Z]/.test(pw)) return "A senha deve conter ao menos uma letra maiúscula.";
    if (!/\d/.test(pw)) return "A senha deve conter ao menos um número.";
    if (!/[^A-Za-z0-9]/.test(pw)) return "A senha deve conter ao menos um caractere especial.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token ausente.");
      return;
    }
    if (!email) {
      setError("E-mail ausente.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    const pwError = validatePasswordClientSide(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);

    try {

      const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";
      const res = await fetch(`${apiBase}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirm,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.errors) {

          const first = Object.values(data.errors)[0];
          setError(Array.isArray(first) ? first[0] : String(first));
        } else if (data?.message) {
          setError(data.message);
        } else {
          setError("Erro ao redefinir senha.");
        }
        return;
      }

      setSuccess(true);

      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
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
    
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
            Redefinir Senha
          </h2>

          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          {validToken ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Seu e-mail"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite a nova senha"
                />
              </div>
              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Confirme a nova senha
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  required
                  minLength={8}
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
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando formulário de nova senha...</div>}>
      <NewPasswordPageContent />
    </Suspense>
  )
}
