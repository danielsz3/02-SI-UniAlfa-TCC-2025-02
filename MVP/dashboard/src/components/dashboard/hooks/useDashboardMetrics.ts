import { useList } from "react-admin";
import { useMemo } from "react";
import { DateFilters } from "../DashboardPage";

interface DashboardMetrics {
  activeUsers: number;
  totalAdocoes: number;
  animaisDisponiveis: number;
  taxaConversao: number;
}

export default function useDashboardMetrics(filters: DateFilters): DashboardMetrics {
  const { startDate, endDate } = filters;

  // 🧠 Estratégia: chamamos useList() para cada entidade e filtramos os dados.
  const usersList = useList({
    resource: "usuarios",
    filter: {
      ativo: 1,
      created_at_from: startDate,
      created_at_to: endDate,
    },
    perPage: 1, // performance (a contagem vem do header Content-Range)
  });

  const adocoesList = useList({
    resource: "adocoes",
    filter: {
      created_at_from: startDate,
      created_at_to: endDate,
    },
    perPage: 1,
  });

  const animaisList = useList({
    resource: "animais",
    filter: { situacao: "disponivel" },
    perPage: 1,
  });

  // 🧮 métricas derivadas
  const activeUsers = usersList.total ?? 0;
  const totalAdocoes = adocoesList.total ?? 0;
  const animaisDisponiveis = animaisList.total ?? 0;

  // Taxa de conversão (simplificada)
  const taxaConversao = useMemo(() => {
    const totalUsuarios = usersList.total ?? 0;
    const totalSolicitacoes = totalAdocoes;
    if (totalUsuarios === 0) return 0;
    return Math.round((totalSolicitacoes / totalUsuarios) * 100);
  }, [usersList.total, totalAdocoes]);

  return {
    activeUsers,
    totalAdocoes,
    animaisDisponiveis,
    taxaConversao,
  };
}
