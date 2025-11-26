"use client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type Option = {
  value: string
  title: string
  description?: string
  id: string
}
type Props = {
  name: string
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  columns?: 1 | 2 | 3
}

function cardClass(selected: boolean) {
  return [
    "border rounded-lg p-4 md:p-5 flex flex-col gap-2 cursor-pointer transition-colors",
    selected
      ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary"
      : "border-muted"
  ].join(" ")
}

export default function RadioCardGroup({ name, value, onValueChange, options, columns = 3 }: Props) {
  const grid = columns === 3 ? "md:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : "md:grid-cols-1"
  return (
    <RadioGroup
      name={name}
      value={value}
      onValueChange={onValueChange}
      className={`grid grid-cols-1 ${grid} gap-4`}
      required
    >
      {options.map(opt => (
        <div key={opt.value} className={cardClass(value === opt.value)}>
          <label htmlFor={opt.id} className="w-full h-full cursor-pointer flex flex-col gap-2">
            <RadioGroupItem value={opt.value} id={opt.id} className="mb-1" />
            <span className="font-medium">{opt.title}</span>
            {opt.description && (
              <span className="text-xs text-muted-foreground">{opt.description}</span>
            )}
          </label>
        </div>
      ))}
    </RadioGroup>
  )
}
