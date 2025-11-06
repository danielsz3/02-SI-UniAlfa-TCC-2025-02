// components/MatchModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type AnimalImagem = { id?: number; url?: string; nome_original?: string };
export type Animal = {
  id: number;
  nome: string;
  tamanho?: string | null;
  nivel_energia?: string | null;
  tempo_necessario?: string | null;
  ambiente_ideal?: string | null;
  situacao?: string | null;
  data_nascimento?: string | null;
  imagens?: AnimalImagem[];
};

export type MatchItem = {
  id: number;
  usuario_id: number;
  animal_id: number;
  status: 'em_adocao' | 'escolhido' | 'rejeitado';
  created_at?: string;
  animal: Animal;
};

type Props = {
  open: boolean;
  item: MatchItem | null;
  onClose: () => void;
  onChangeStatus: (item: MatchItem, status: 'escolhido' | 'rejeitado') => Promise<void>;
  fetchAfinidade?: (animalId: number) => Promise<number | null>;
};

export default function MatchModal({ open, item, onClose, onChangeStatus, fetchAfinidade }: Props) {
  const [afinidadePercent, setAfinidadePercent] = useState<number | null>(null);
  const [loadingPercent, setLoadingPercent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let mountedLocal = true;
    async function loadAfinidade() {
      setAfinidadePercent(null);
      if (!item || !fetchAfinidade) return;
      setLoadingPercent(true);
      try {
        const p = await fetchAfinidade(item.animal.id);
        if (!mountedLocal) return;
        setAfinidadePercent(p ?? null);
      } catch (e) {
        console.error('Erro fetch afinidade', e);
        setAfinidadePercent(null);
      } finally {
        if (mountedLocal) setLoadingPercent(false);
      }
    }
    if (open) loadAfinidade();
    return () => { mountedLocal = false; };
  }, [open, item, fetchAfinidade]);

  if (!mounted) return null;
  if (!open) return null;

  const handleAction = async (status: 'escolhido' | 'rejeitado') => {
    if (!item) return;
    setActionLoading(true);
    try {
      await onChangeStatus(item, status);
    } catch (e) {
      console.error('Erro onChangeStatus', e);
    } finally {
      setActionLoading(false);
    }
  };

  const idadeLabel = (d?: string | null) => {
    if (!d) return null;
    try {
      const nas = new Date(d);
      const years = Math.floor((Date.now() - nas.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      return years > 0 ? `${years} ano${years > 1 ? 's' : ''}` : 'Menos de 1 ano';
    } catch {
      return null;
    }
  };

  const img = item?.animal.imagens?.[0]?.url ?? '/no-image-available.png';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md">
        <Card className="overflow-hidden rounded-lg">
          <CardContent className="p-0">
            <div className="relative">
              <img src={img} alt={item?.animal.nome} className="w-full h-96 object-cover bg-muted" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white leading-tight">{item?.animal.nome ?? '—'}</h3>
                    <p className="text-xs text-white/80 mt-1">
                      {[idadeLabel(item?.animal.data_nascimento), item?.animal.tamanho].filter(Boolean).join(' • ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-white/80">Afinidade</p>
                    <p className="text-xl font-bold text-emerald-200">
                      {loadingPercent ? '...' : (afinidadePercent !== null ? `${afinidadePercent}%` : '—')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* actions area */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-t from-white/5 to-white/0">
              <button
                aria-label="Rejeitar"
                onClick={() => handleAction('rejeitado')}
                disabled={actionLoading}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl text-rose-500 shadow-lg transition"
              >
                ✕
              </button>

              <button
                aria-label="Fechar"
                onClick={onClose}
                className="text-sm text-muted-foreground underline"
              >
                Fechar
              </button>

              <button
                aria-label="Escolher"
                onClick={() => handleAction('escolhido')}
                disabled={actionLoading}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl text-emerald-500 shadow-lg transition"
              >
                ❤
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
