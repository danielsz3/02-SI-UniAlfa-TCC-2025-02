"use client"

import { useRef, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  label?: string
  name?: string
  defaultPreviewUrl?: string | null
  onChange?: (file: File | null) => void
  className?: string
  required?: boolean
}

export function AvatarUpload({
  label = "Foto de Perfil",
  name = "imagem",
  defaultPreviewUrl = null,
  onChange,
  className,
  required = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(defaultPreviewUrl)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndSetFile = (f: File | undefined) => {
    if (!f) return

    // Validação de tipo
    if (!f.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido (png, jpg, webp).")
      return
    }

    // Validação de tamanho (10MB)
    if (f.size > 10 * 1024 * 1024) {
      setError("A imagem deve ter até 10MB.")
      return
    }

    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    onChange?.(f)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    validateAndSetFile(f)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    validateAndSetFile(f)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const clearImage = () => {
    setFile(null)
    setPreview(defaultPreviewUrl)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onChange?.(null)
  }

  const triggerFileDialog = () => fileInputRef.current?.click()

  return (
    <div className={cn("w-full flex flex-col items-center gap-4", className)}>
      {/* Label */}
      <label className="text-sm font-medium text-muted-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Avatar com drag & drop */}
      <div
        className="relative group"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Avatar Preview */}
        <Avatar
          className={cn(
            "h-32 w-32 border-2 shadow-md transition-all",
            dragActive ? "border-primary scale-105" : "border-border"
          )}
        >
          {preview ? (
            <AvatarImage src={preview} alt="Foto de perfil" />
          ) : (
            <AvatarFallback className="bg-muted">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>

        {/* Overlay no hover */}
        <div
          onClick={triggerFileDialog}
          className={cn(
            "absolute inset-0 rounded-full bg-black/50 opacity-0 transition-opacity",
            "flex items-center justify-center cursor-pointer",
            "group-hover:opacity-100"
          )}
        >
          <Upload className="h-7 w-7 text-white" />
        </div>

        {/* Botão remover */}
        {preview && (
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 rounded-full bg-background border-2 border-border shadow-md p-1.5 hover:bg-accent transition-colors"
            aria-label="Remover imagem"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Indicador de drag ativo */}
        {dragActive && (
          <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Input invisível */}
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mensagem de erro */}
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      {/* Botão de upload (quando não há preview) */}
      {!preview && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={triggerFileDialog}
        >
          <Upload className="h-4 w-4" /> Escolher imagem
        </Button>
      )}

      {/* Dica visual */}
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Clique, arraste ou solte uma imagem aqui
        <br />
        <span className="font-medium">PNG, JPG ou WEBP • Até 10MB</span>
      </p>
    </div>
  )
}
