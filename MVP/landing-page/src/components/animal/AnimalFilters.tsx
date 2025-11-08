// components/animal/AnimalFilters.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AgeRangeKey } from "@/types"

interface AnimalFiltersProps {
  tipoAnimal: string
  onTipoAnimalChange: (value: string) => void
  sexo: string
  onSexoChange: (value: string) => void
  ageRange: AgeRangeKey
  onAgeRangeChange: (value: AgeRangeKey) => void
  onApply: () => void
  onReset: () => void
}

export function AnimalFilters({
  tipoAnimal, onTipoAnimalChange,
  sexo, onSexoChange,
  ageRange, onAgeRangeChange,
  onApply, onReset
}: AnimalFiltersProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-3 items-start md:items-end justify-between">
      <div className="flex gap-3 w-full md:w-auto flex-col md:flex-row">

        {/* Filtro Tipo */}
        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <Select onValueChange={onTipoAnimalChange} value={tipoAnimal}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="cao">Cão</SelectItem>
              <SelectItem value="gato">Gato</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Gênero */}
        <div>
          <label className="block text-sm mb-1">Gênero</label>
          <Select onValueChange={onSexoChange} value={sexo}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="macho">Macho</SelectItem>
              <SelectItem value="femea">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Idade */}
        <div>
          <label className="block text-sm mb-1">Idade</label>
          <Select onValueChange={(v) => onAgeRangeChange(v as AgeRangeKey)} value={ageRange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              <SelectItem value="0_1">Até 1 ano</SelectItem>
              <SelectItem value="1_3">1 - 3 anos</SelectItem>
              <SelectItem value="3_8">3 - 8 anos</SelectItem>
              <SelectItem value="8_plus">8+ anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onReset}>Limpar</Button>
        <Button onClick={onApply}>Aplicar</Button>
      </div>
    </div>
  )
}