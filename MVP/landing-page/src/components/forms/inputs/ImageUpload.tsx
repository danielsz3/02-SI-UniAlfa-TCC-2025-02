import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ChangeEvent } from "react"

interface ImageUploadProps {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  preview: string[]
  maxFiles?: number
}

export function ImageUpload({ onChange, preview, maxFiles = 10 }: ImageUploadProps) {
  return (
    <div className="space-y-3">
      <Label>Coloque imagens do Animal (máx. {maxFiles})</Label>
      <div className="border border-dashed rounded-md border-muted-foreground/50 p-6 text-center hover:bg-muted/40 transition cursor-pointer">
        <Input
          id="imagens"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          multiple
          onChange={onChange}
          className="hidden"
        />
        <label htmlFor="imagens" className="cursor-pointer block">
          <div className="text-sm text-muted-foreground">
            Clique ou arraste para enviar imagens
          </div>
        </label>
        
        {preview.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {preview.map((src, index) => (
              <div key={index} className="relative group">
                <img
                  src={src}
                  alt={`Prévia ${index + 1}`}
                  className="h-24 w-full object-cover rounded-md border"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
