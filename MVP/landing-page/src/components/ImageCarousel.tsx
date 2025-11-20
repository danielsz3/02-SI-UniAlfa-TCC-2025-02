"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Imagens } from "@/types"

interface ImageCarouselProps {
  images: Imagens[]
  alt?: string
  className?: string
  showArrows?: boolean
  showIndicators?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  variant?: "default" | "minimal"
}

export default function ImageCarousel({
  images,
  alt = "Imagem",
  className = "",
  showArrows = true,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  variant = "default",
}: ImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const autoPlayTimer = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const count = images.length

  const prev = useCallback(() => setIndex((i) => (i - 1 + Math.max(1, count)) % Math.max(1, count)), [count])
  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(1, count)), [count])

  // autoplay (cancela em unmount)
  useEffect(() => {
    if (!autoPlay || count <= 1) return
    const tick = () => setIndex((i) => (i + 1) % count)
    autoPlayTimer.current = window.setInterval(tick, autoPlayInterval)
    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current)
        autoPlayTimer.current = null
      }
    }
  }, [autoPlay, autoPlayInterval, count])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current)
        autoPlayTimer.current = null
      }
    }
  }, [])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next])

  // touch handlers
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0]?.clientX ?? null }
  const onTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0]?.clientX ?? null }
  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const dx = touchStartX.current - touchEndX.current
    const threshold = 40
    if (dx > threshold) next()
    else if (dx < -threshold) prev()
    touchStartX.current = null
    touchEndX.current = null
  }

  if (count === 0) {
    return (
      <div className={`w-full rounded-md bg-card/70 flex items-center justify-center h-56 ${className}`}>
        <p className="text-muted-foreground">Sem imagens</p>
      </div>
    )
  }

  return (
    <div
      className={`relative h-full w-full rounded-md overflow-hidden bg-card ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Galeria de imagens"
    >
      {/* imagens com fade */}
      <div className="w-full h-full relative">
        {images.map((image, i) => (
          <img
            key={i}
            src={`${process.env.NEXT_PUBLIC_API_URL}/imagens/${image.caminho}`}
            alt={`${alt}${count > 1 ? ` (${i + 1} de ${count})` : ""}`}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          />
        ))}
      </div>

      {/* arrows */}
      {(variant === "default" || showArrows) && count > 1 && (
        <>
          <div className="z-11 absolute left-3 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                prev()
                if (autoPlayTimer.current) { clearInterval(autoPlayTimer.current); autoPlayTimer.current = null }
              }}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </Button>
          </div>

          <div className="z-11 absolute right-3 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                next()
                if (autoPlayTimer.current) { clearInterval(autoPlayTimer.current); autoPlayTimer.current = null }
              }}
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </>
      )}

      {/* indicators */}
      {showIndicators && count > 1 && (
        <div className="absolute z-11 left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); if (autoPlayTimer.current) { clearInterval(autoPlayTimer.current); autoPlayTimer.current = null } }}
              aria-label={`Ir para o slide ${i + 1}`}
              className="focus:outline-none"
            >
              {variant === "default" ? (
                <>
                  {i === index ? (
                    <Badge variant="secondary" className="px-3 py-1">{i + 1}</Badge>
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-muted/60" />
                  )}
                </>
              ) : (
                // Variante minimalista: apenas pontos
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === index ? "bg-primary" : "bg-muted/60"
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}