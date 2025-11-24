import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ChangeEvent } from "react"

interface FormInputProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  maxLength?: number
  max?: string
  placeholder?: string
}

export function FormInput({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  required, 
  maxLength, 
  max, 
  placeholder 
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        max={max}
        placeholder={placeholder}
      />
    </div>
  )
}
