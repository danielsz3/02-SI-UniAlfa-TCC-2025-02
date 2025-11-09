// components/animal/PaginationControls.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- Componente interno PageSizeSelect ---
interface PageSizeSelectProps {
  perPage: number
  pageSizeOptions: number[]
  onPageSizeChange: (newSize: number) => void
}

function PageSizeSelect({ perPage, pageSizeOptions, onPageSizeChange }: PageSizeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Linhas por página:</span>
      <Select value={String(perPage)} onValueChange={(v) => onPageSizeChange(Number(v))}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-auto">
          {pageSizeOptions.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// --- Componente principal PaginationControls ---
interface PaginationControlsProps {
  currentPage: number
  totalPages: number | null
  perPage: number
  pageSizeOptions: number[]
  loading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (newSize: number) => void
}

export function PaginationControls({
  currentPage, totalPages, perPage, pageSizeOptions, loading, onPageChange, onPageSizeChange
}: PaginationControlsProps) {

  // quando total desconhecido -> versão compacta
  if (totalPages === null) {
    return (
      <div className="w-full flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <PageSizeSelect {...{ perPage, pageSizeOptions, onPageSizeChange }} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => onPageChange(1)} disabled={currentPage <= 1 || loading}>Primeira</Button>
          <Button variant="outline" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1 || loading}>Anterior</Button>
          <Badge variant="secondary">Página {currentPage}</Badge>
          <Button variant="outline" onClick={() => onPageChange(currentPage + 1)} disabled={loading}>Próxima</Button>
        </div>
      </div>
    )
  }

  // --- Lógica de paginação completa (quando totalPages é conhecido) ---
  const total = totalPages
  const current = currentPage
  const windowSize = 2
  const buttons: (number | "ellipsis")[] = []
  const left = Math.max(2, current - windowSize)
  const right = Math.min(total - 1, current + windowSize)

  buttons.push(1)
  if (left > 2) buttons.push("ellipsis")
  for (let p = left; p <= right; p++) buttons.push(p)
  if (right < total - 1) buttons.push("ellipsis")
  if (total > 1) buttons.push(total)

  const JUMP_SELECT_LIMIT = 500

  return (
    <div className="w-full flex flex-col sm:flex-row items-center gap-3">
      {/* esquerda: seletor de tamanho */}
      <div className="flex items-center gap-3">
        <PageSizeSelect {...{ perPage, pageSizeOptions, onPageSizeChange }} />
      </div>

      {/* centro: paginação (full em sm+, compact em xs) */}
      <div className="flex-1 flex justify-center">
        {/* full pagination para telas sm+ */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onPageChange(1)} disabled={current <= 1 || loading}>Primeira</Button>
          <Button variant="outline" onClick={() => onPageChange(Math.max(1, current - 1))} disabled={current <= 1 || loading}>Anterior</Button>

          {buttons.map((b, idx) =>
            b === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-2 text-sm text-muted-foreground">…</span>
            ) : (
              <div key={b} className="flex">
                {b === current ? (
                  <Badge className="px-3 py-1">{b}</Badge>
                ) : (
                  <Button variant="ghost" onClick={() => onPageChange(Number(b))} disabled={loading}>{b}</Button>
                )}
              </div>
            )
          )}

          <Button variant="outline" onClick={() => onPageChange(Math.min(total, current + 1))} disabled={current >= total || loading}>Próxima</Button>
          <Button variant="outline" onClick={() => onPageChange(total)} disabled={current >= total || loading}>Última</Button>
        </div>

        {/* compact pagination para xs */}
        <div className="flex sm:hidden items-center gap-2">
          <Button variant="outline" onClick={() => onPageChange(Math.max(1, current - 1))} disabled={current <= 1 || loading}>Anterior</Button>
          <Badge variant="secondary">Página {current} de {total}</Badge>
          <Button variant="outline" onClick={() => onPageChange(Math.min(total, current + 1))} disabled={current >= total || loading}>Próxima</Button>
        </div>
      </div>

      {/* direita: jump-to select (sm+) */}
      <div className="hidden sm:flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Ir para</label>

        {total <= JUMP_SELECT_LIMIT ? (
          <Select value={String(current)} onValueChange={(v) => onPageChange(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-auto">
              {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
                <SelectItem key={p} value={String(p)}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm font-semibold">{current}</span> // fallback simples para >500 páginas
        )}

        <span className="text-sm text-muted-foreground">de {total}</span>
      </div>
    </div>
  )
}