"use client"

import { ChangeEvent, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCPF, isValidCPF, cleanCPF } from "@/lib/validators/forms/cpf"
import { CheckCircle2, XCircle } from "lucide-react"

interface CPFFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  error?: string
  className?: string
}

export default function CPFField({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  error,
  className,
}: CPFFieldProps) {
  const [touched, setTouched] = useState(false)
  const cpfLimpo = cleanCPF(value)
  const isValid = cpfLimpo.length === 11 && isValidCPF(cpfLimpo)
  const showValidation = touched && cpfLimpo.length === 11

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    // Cria um evento sintético com o valor formatado
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: cleanCPF(formatted), // Envia apenas números para o state
      },
    }
    onChange(syntheticEvent as ChangeEvent<HTMLInputElement>)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="text"
          value={formatCPF(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="000.000.000-00"
          maxLength={14}
          required={required}
          className={`pr-10 ${error ? "border-red-500" : ""} ${
            showValidation && isValid ? "border-green-500" : ""
          }`}
        />
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {!error && showValidation && !isValid && (
        <p className="text-sm text-red-600 mt-1">CPF inválido</p>
      )}
    </div>
  )
}
