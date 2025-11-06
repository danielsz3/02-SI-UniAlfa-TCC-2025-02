// app/painel-adotante/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MatchModal, { MatchItem } from '@/components/MatchModal';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'token';

type AnimalImagem = { id?: number; url?: string; nome_original?: string };
type Animal = {
  id: number;
  nome: string;
  tamanho?: string | null;
  data_nascimento?: string | null;
  imagens?: AnimalImagem[];
};

type MatchWithAffinity = MatchItem & { afinidade_percent?: number | null };

export default function PainelAdotantePage() {
  const [me, setMe] = useState<{ id: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'em_adocao' | 'escolhido' | 'rejeitado'>('em_adocao');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Queue state for Tinder-like flow
  const [matchQueue, setMatchQueue] = useState<MatchWithAffinity[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  const [selected, setSelected] = useState<MatchItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const initialAutoOpenRef = useRef(true);

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  async function fetchMe() {
    try {
      const res = await fetch(`${API_BASE}/me`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Não autorizado');
      const data = await res.json();
      setMe({ id: data.id });
      return data;
    } catch (e) {
      console.error('Erro /me', e);
      setMe(null);
      return null;
    }
  }

  async function fetchMatches(userId?: number, status?: string): Promise<MatchItem[]> {
    if (!userId) return [];
    setLoading(true);
    try {
      const url = `${API_BASE}/match-afinidades?usuario_id=${userId}${status ? `&status=${status}` : ''}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erro ao buscar matches');
      }
      const json = await res.json();
      const items: MatchItem[] = Array.isArray(json) ? json : (json.data ?? json.items ?? json);
      setMatches(items);
      return items;
    } catch (e) {
      console.error(e);
      setMatches([]);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await fetchMe();
      if (!mounted) return;
      if (user?.id) {
        const items = await fetchMatches(user.id, statusFilter);
        // autostart first match on first load (keeps previous behavior)
        if (initialAutoOpenRef.current && statusFilter === 'em_adocao' && items.length > 0) {
          // keep previous behavior: auto-open first (but not necessarily ordered by affinity)
          setSelected(items[0]);
          initialAutoOpenRef.current = false;
        }
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!me) return;
    fetchMatches(me.id, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, me?.id]);

  // When selected changes, open/close modal
  useEffect(() => {
    if (selected) setModalOpen(true);
    else setModalOpen(false);
  }, [selected]);

  const counts = useMemo(() => ({
    em_adocao: matches.filter(m => m.status === 'em_adocao').length,
    escolhido: matches.filter(m => m.status === 'escolhido').length,
    rejeitado: matches.filter(m => m.status === 'rejeitado').length,
  }), [matches]);

  function calcularIdade(dataNascimento?: string | null) {
    if (!dataNascimento) return null;
    try {
      const nas = new Date(dataNascimento);
      const years = Math.floor((Date.now() - nas.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      return years > 0 ? `${years} ano${years > 1 ? 's' : ''}` : 'Menos de 1 ano';
    } catch {
      return null;
    }
  }

  async function fetchAfinidade(animalId: number) {
    if (!me) return null;
    try {
      const res = await fetch(`${API_BASE}/usuarios/${me.id}/recomendar-animais`, { headers: authHeaders() });
      if (!res.ok) return null;
      const recs = await res.json();
      const found = recs.find((r: any) => r.animal?.id === animalId);
      return found?.afinidade_percent ?? null;
    } catch (e) {
      console.error('Erro recomendacoes', e);
      return null;
    }
  }

  // Opens modal for a specific item (keeps previous behavior)
  function openModal(item: MatchItem) {
    setSelected(item);
  }

  function openSelectedModal() {
    if (!selected) {
      console.warn('Nenhum item selecionado');
      return;
    }
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setSelected(null);
    // clear queue when user closes manually (optional)
    setMatchQueue([]);
    setQueueIndex(0);
  }

  // START MATCHING: build queue of em_adocao matches ordered by affinity desc
  async function startMatching() {
    if (!me) {
      alert('Usuário não autenticado');
      return;
    }

    const items = await fetchMatches(me.id, 'em_adocao');
    if (items.length === 0) {
      alert('Nenhum match disponível no momento.');
      return;
    }

    // fetch affinities in parallel
    const affinities = await Promise.all(items.map(async (it) => {
      try {
        const p = await fetchAfinidade(it.animal.id);
        return p;
      } catch {
        return null;
      }
    }));

    // build queue
    const queue: MatchWithAffinity[] = items.map((it, idx) => ({
      ...it,
      afinidade_percent: affinities[idx] ?? null,
    }));

    // sort by afinidade_percent desc, null -> -1 (go to end)
    queue.sort((a, b) => {
      const va = (a.afinidade_percent ?? -1);
      const vb = (b.afinidade_percent ?? -1);
      return vb - va;
    });

    setMatchQueue(queue);
    setQueueIndex(0);
    // set selected to first in queue
    setSelected(queue[0] ?? null);
  }

  // On change status (X or Heart) we call backend and advance queue index
  async function handleChangeStatus(item: MatchItem, status: 'escolhido' | 'rejeitado') {
    if (!me) {
      alert('Usuário não autenticado');
      return;
    }
    if (!item) return;
    setActionLoading(true);
    try {
      const body = { usuario_id: item.usuario_id, animal_id: item.animal_id, status };
      const res = await fetch(`${API_BASE}/match-afinidades/mudar-status`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.error || json.message)) || 'Erro ao alterar status';
        alert(msg);
        throw new Error(msg);
      }

      // refresh matches / counts in background
      fetchMatches(me.id, statusFilter).catch(e => console.error(e));

      // if we're using the queue flow, advance to next in queue
      if (matchQueue.length > 0) {
        const nextIndex = queueIndex + 1;
        if (nextIndex < matchQueue.length) {
          setQueueIndex(nextIndex);
          setSelected(matchQueue[nextIndex]);
        } else {
          // no more items in queue
          setSelected(null);
          setMatchQueue([]);
          setQueueIndex(0);
        }
      } else {
        // fallback: find next from matches array (older behavior)
        const items = matches.filter(m => m.status === 'em_adocao' && m.id !== item.id);
        if (items.length > 0) setSelected(items[0]);
        else setSelected(null);
      }
    } catch (e) {
      console.error('Erro ao alterar status', e);
      throw e;
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold">Painel do Adotante</h3>
          <p className="text-sm text-muted-foreground">Gerencie seus pedidos e veja afinidades</p>
        </div>

        <div className="flex items-center gap-3">

          <Button asChild>
            <a href="/adotar">Animais disponíveis para Adoção</a>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setStatusFilter('em_adocao')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'em_adocao' ? 'bg-sky-600 text-white' : 'bg-muted/30 text-muted-foreground'}`}
        >
          Aprovados <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">{counts.em_adocao}</span>
        </button>

        <button
          onClick={() => setStatusFilter('escolhido')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'escolhido' ? 'bg-sky-600 text-white' : 'bg-muted/30 text-muted-foreground'}`}
        >
          Escolhidos <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">{counts.escolhido}</span>
        </button>

        <button
          onClick={() => setStatusFilter('rejeitado')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'rejeitado' ? 'bg-sky-600 text-white' : 'bg-muted/30 text-muted-foreground'}`}
        >
          Rejeitados <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">{counts.rejeitado}</span>
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Carregando...</div>
      ) : matches.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((item) => {
            const img = item.animal.imagens?.[0]?.url ?? '/no-image-available.png';
            const idade = calcularIdade(item.animal.data_nascimento) ?? '';
            const porte = item.animal.tamanho ?? '';

            const statusColor =
              item.status === 'escolhido' ? 'bg-emerald-100 text-emerald-700' :
              item.status === 'rejeitado' ? 'bg-rose-100 text-rose-700' :
              'bg-yellow-50 text-yellow-700';

            return (
              <Card key={item.id} className="flex items-center gap-4 p-3 hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 rounded overflow-hidden bg-muted flex items-center justify-center">
                  <img src={img} alt={item.animal.nome} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold truncate">{item.animal.nome}</h4>
                      <p className="text-sm text-muted-foreground truncate">{[idade, porte].filter(Boolean).join(' • ')}</p>
                    </div>

                    <div className={`text-xs px-2 py-1 rounded-full ${statusColor} whitespace-nowrap`}>
                      {item.status.replace('_', ' ')}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">Pedido: {new Date(item.created_at ?? Date.now()).toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openModal(item)}>Ver</Button>
                    <Button size="sm" onClick={() => openModal(item)}>Abrir</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <MatchModal
        open={modalOpen}
        item={selected}
        onClose={handleCloseModal}
        onChangeStatus={handleChangeStatus}
        fetchAfinidade={fetchAfinidade}
      />
    </div>
  );
}
