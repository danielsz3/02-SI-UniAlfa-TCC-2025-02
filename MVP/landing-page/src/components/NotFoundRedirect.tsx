'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFoundRedirect() {
  const router = useRouter()

  useEffect(() => {
    alert('Ops! A página que você tentou acessar não existe. Você será redirecionado para a página inicial.')
    router.replace('/')
  }, [router])

  return null
}
