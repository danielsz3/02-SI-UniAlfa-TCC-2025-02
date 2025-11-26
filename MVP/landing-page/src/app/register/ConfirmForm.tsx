"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function onlyDigits(s?: string) {
  return (s || "").replace(/\D/g, "");
}
function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}
function isDateISO(s?: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || "");
}

function mapTempo(v?: string) {
  switch ((v || "").toLowerCase()) {
    case "pouco":
    case "pouco_tempo":
      return "pouco_tempo";
    case "moderado":
    case "tempo_moderado":
      return "tempo_moderado";
    case "muito":
    case "muito_tempo":
      return "muito_tempo";
    default:
      return undefined;
  }
}
function mapEstilo(v?: string) {
  switch ((v || "").toLowerCase()) {
    case "tranquila":
    case "vida_tranquila":
      return "vida_tranquila";
    case "equilibrado":
    case "ritmo_equilibrado":
      return "ritmo_equilibrado";
    case "acao":
    case "sempre_em_acao":
      return "sempre_em_acao";
    default:
      return undefined;
  }
}
function mapEspaco(v?: string) {
  switch ((v || "").toLowerCase()) {
    case "pequeno":
    case "area_pequena":
      return "area_pequena";
    case "area_interna":
    case "area_media":
      return "area_media";
    case "quintal":
    case "area_externa":
      return "area_externa";
    default:
      return undefined;
  }
}

function validateClient(data: any) {
  const errors: Record<string, string> = {};

  if (!data.nome || String(data.nome).trim().length < 2) errors.nome = "Nome deve ter pelo menos 2 caracteres.";
  if (!isEmail(data.email)) errors.email = "E-mail inválido.";

  const pwd = String(data.senha || "");
  if (pwd.length < 8) errors.password_len = "Senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Z]/.test(pwd) || !/\d/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd)) {
    errors.password_strength = "Senha deve ter 1 maiúscula, 1 número e 1 caractere especial.";
  }
  if (data.senha !== data.confirmarSenha) errors.password_confirmation = "Confirmação de senha não confere.";

  const cpf = onlyDigits(data.cpf);
  if (!cpf || cpf.length !== 11) errors.cpf = "CPF deve ter 11 dígitos.";

  if (!isDateISO(data.dataNascimento)) errors.data_nascimento = "Data no formato YYYY-MM-DD.";

  if (data.telefone) {
    const tel = onlyDigits(data.telefone);
    if (tel.length !== 11) errors.telefone = "Telefone deve ter 11 dígitos (com DDD).";
  } else {
    errors.telefone = "Telefone é obrigatório.";
  }

  // Endereço
  const cep = onlyDigits(data.cep);
  if (!cep || cep.length !== 8) errors.cep = "CEP inválido (8 dígitos).";
  if (!data.logradouro) errors.logradouro = "Logradouro é obrigatório.";
  if (!data.numero) errors.numero = "Número é obrigatório.";
  if (!data.cidade) errors.cidade = "Cidade é obrigatória.";
  if (!data.estado || String(data.estado).length !== 2) errors.uf = "UF deve ter 2 letras (ex: PR, SP).";

  // Preferências
  const tp = (data.tamanhoPet || "").toLowerCase();
  if (!["pequeno", "medio", "grande"].includes(tp)) errors.tamanho_pet = 'Selecione "pequeno", "medio" ou "grande".';
  if (!mapTempo(data.tempoCuidar)) errors.tempo_disponivel = 'Selecione "pouco", "moderado" ou "muito".';
  if (!mapEstilo(data.estiloVida)) errors.estilo_vida = 'Selecione "tranquila", "equilibrado" ou "acao".';
  if (!mapEspaco(data.espaco)) errors.espaco_casa = 'Selecione "pequeno", "area_interna" ou "quintal".';

  return errors;
}

function buildApiPayload(data: any) {
  const telefone = onlyDigits(data.telefone);
  const cpf = onlyDigits(data.cpf);

  const payload: any = {
    nome: data.nome,
    email: data.email,
    password: data.senha,
    password_confirmation: data.confirmarSenha,
    cpf,
    data_nascimento: data.dataNascimento, // "YYYY-MM-DD"
    telefone,
    role: "user",
    endereco: {
      cep: onlyDigits(data.cep),
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.estado, // 2 letras
    },
    preferencias: {
      tamanho_pet: (data.tamanhoPet || "").toLowerCase(), // pequeno|medio|grande
      tempo_disponivel: mapTempo(data.tempoCuidar),
      estilo_vida: mapEstilo(data.estiloVida),
      espaco_casa: mapEspaco(data.espaco),
    },
  };

  // Limpar campos vazios opcionais
  for (const k of Object.keys(payload.endereco)) {
    if (payload.endereco[k] === undefined || payload.endereco[k] === "") delete payload.endereco[k];
  }
  for (const k of Object.keys(payload.preferencias)) {
    if (payload.preferencias[k] === undefined || payload.preferencias[k] === "") delete payload.preferencias[k];
  }

  return payload;
}

function humanizePreferencias(data: any) {
  // Mostra labels “bonitas” para revisão visual
  const tempoMap: Record<string, string> = {
    pouco: "Pouco tempo",
    moderado: "Tempo moderado",
    muito: "Muito tempo",
  };
  const estiloMap: Record<string, string> = {
    tranquila: "Vida tranquila",
    equilibrado: "Ritmo equilibrado",
    acao: "Sempre em ação",
  };
  const espacoMap: Record<string, string> = {
    pequeno: "Espaço pequeno",
    area_interna: "Área interna",
    quintal: "Quintal/área externa",
  };
  return {
    tamanho: (data.tamanhoPet || "").toLowerCase(),
    tempo: tempoMap[(data.tempoCuidar || "").toLowerCase()] || data.tempoCuidar,
    estilo: estiloMap[(data.estiloVida || "").toLowerCase()] || data.estiloVida,
    espaco: espacoMap[(data.espaco || "").toLowerCase()] || data.espaco,
  };
}

export default function ConfirmForm({ data, onBack }: { data: any; onBack: () => void }) {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const clientErrors = useMemo(() => validateClient(data), [data]);
  const pref = useMemo(() => humanizePreferencias(data), [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});
    setLoading(true);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setGlobalError("Revise os campos destacados.");
      setLoading(false);
      return;
    }

    try {
      const body = buildApiPayload(data);

      const res = await fetch(`${apiUrl}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        if (errJson?.errors) {
          // Erros por campo vindos do backend (422)
          const serverFieldErrors: Record<string, string> = {};
          Object.entries(errJson.errors).forEach(([k, v]) => {
            const msgs = Array.isArray(v) ? v : [String(v)];
            serverFieldErrors[k] = msgs[0];
          });
          setFieldErrors(serverFieldErrors);
          const first = Object.values(serverFieldErrors)[0];
          throw new Error(typeof first === "string" ? first : "Erro de validação");
        }
        throw new Error(errJson?.message || "Erro ao cadastrar usuário");
      }

      setSuccess(true);
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mt-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Cadastro realizado com sucesso!</h2>
        <p className="mb-4 text-slate-700 dark:text-slate-300">Você já pode fazer login.</p>
        <Button onClick={() => router.push("/login")}>Ir para Login</Button>
      </div>
    );
  }

  return (
    <form className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mt-8" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">Confirme seus dados</h2>

      {globalError && <p className="text-red-600 text-center mb-4">{globalError}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Campo</TableHead>
            <TableHead className="w-2/3">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Dados pessoais */}
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>
              {data.nome}
              {fieldErrors.nome && <span className="text-red-600 block">{fieldErrors.nome}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>E-mail</TableCell>
            <TableCell>
              {data.email}
              {fieldErrors.email && <span className="text-red-600 block">{fieldErrors.email}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Telefone</TableCell>
            <TableCell>
              {data.telefone}
              {fieldErrors.telefone && <span className="text-red-600 block">{fieldErrors.telefone}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>CPF</TableCell>
            <TableCell>
              {data.cpf}
              {fieldErrors.cpf && <span className="text-red-600 block">{fieldErrors.cpf}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Data de Nascimento</TableCell>
            <TableCell>
              {data.dataNascimento}
              {fieldErrors.data_nascimento && <span className="text-red-600 block">{fieldErrors.data_nascimento}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Senha</TableCell>
            <TableCell>
              {"•".repeat(String(data.senha || "").length)}
              {fieldErrors.password_len && <span className="text-red-600 block">{fieldErrors.password_len}</span>}
              {fieldErrors.password_strength && <span className="text-red-600 block">{fieldErrors.password_strength}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Confirmar Senha</TableCell>
            <TableCell>
              {"•".repeat(String(data.confirmarSenha || "").length)}
              {fieldErrors.password_confirmation && <span className="text-red-600 block">{fieldErrors.password_confirmation}</span>}
            </TableCell>
          </TableRow>

          {/* Endereço */}
          <TableRow>
            <TableCell>CEP</TableCell>
            <TableCell>
              {data.cep}
              {fieldErrors.cep && <span className="text-red-600 block">{fieldErrors.cep}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Logradouro</TableCell>
            <TableCell>
              {data.logradouro}
              {fieldErrors.logradouro && <span className="text-red-600 block">{fieldErrors.logradouro}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Número</TableCell>
            <TableCell>
              {data.numero}
              {fieldErrors.numero && <span className="text-red-600 block">{fieldErrors.numero}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Complemento</TableCell>
            <TableCell>{data.complemento || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bairro</TableCell>
            <TableCell>{data.bairro || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Cidade</TableCell>
            <TableCell>
              {data.cidade}
              {fieldErrors.cidade && <span className="text-red-600 block">{fieldErrors.cidade}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>UF</TableCell>
            <TableCell>
              {data.estado}
              {fieldErrors.uf && <span className="text-red-600 block">{fieldErrors.uf}</span>}
            </TableCell>
          </TableRow>

          {/* Preferências */}
          <TableRow>
            <TableCell>Tamanho do Pet</TableCell>
            <TableCell>
              {pref.tamanho || data.tamanhoPet}
              {fieldErrors.tamanho_pet && <span className="text-red-600 block">{fieldErrors.tamanho_pet}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Tempo disponível</TableCell>
            <TableCell>
              {pref.tempo || data.tempoCuidar}
              {fieldErrors.tempo_disponivel && <span className="text-red-600 block">{fieldErrors.tempo_disponivel}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Estilo de vida</TableCell>
            <TableCell>
              {pref.estilo || data.estiloVida}
              {fieldErrors.estilo_vida && <span className="text-red-600 block">{fieldErrors.estilo_vida}</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Espaço da casa</TableCell>
            <TableCell>
              {pref.espaco || data.espaco}
              {fieldErrors.espaco_casa && <span className="text-red-600 block">{fieldErrors.espaco_casa}</span>}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onBack} className="w-1/2" disabled={loading}>
          Voltar
        </Button>
        <Button type="submit" className="w-1/2" disabled={loading}>
          {loading ? "Enviando..." : "Confirmar Cadastro"}
        </Button>
      </div>
    </form>
  );
}
