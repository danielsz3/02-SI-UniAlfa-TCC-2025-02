'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function NotFoundModal() {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        setOpen(true)
        const timer = setTimeout(() => {
            setOpen(false)
            router.replace('/')
        }, 1000) 

        return () => clearTimeout(timer)
    }, [router])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Página não encontrada</DialogTitle>
                    <DialogDescription>
                        A página que você tentou acessar não existe ou foi removida. Você será redirecionado para a página inicial.
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
