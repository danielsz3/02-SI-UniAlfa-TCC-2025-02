import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FormSelectProps {
  label: string
  placeholder?: string
  required?: boolean
  options: { value: string; label: string }[]
  onValueChange: (value: string) => void
  value?: string
  disabled?: boolean
}

export function FormSelect({ 
  label, 
  placeholder = "Selecione", 
  required, 
  options, 
  onValueChange,
  value 
}: FormSelectProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select onValueChange={onValueChange} value={value} required={required}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
