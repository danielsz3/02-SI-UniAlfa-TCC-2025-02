'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function NotToken({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [showDialog, setShowDialog] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            const fullPath = pathname + (searchParams ? `?${searchParams.toString()}` : '')
            sessionStorage.setItem('redirectAfterLogin', fullPath)
            setShowDialog(true)
            const timer = setTimeout(() => {
                setShowDialog(false)
                router.replace('/login')
            }, 3000)
            return () => clearTimeout(timer)
        } else {
            setIsAuthorized(true)
        }
    }, [pathname, searchParams, router])

    if (isAuthorized === null) {
        return (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Acesso Restrito</DialogTitle>
                        <DialogDescription>
                            Você precisa estar logado para acessar esta página. Redirecionando para o login...
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        )
    }

    if (!isAuthorized) {
        return null
    }

    return <>{children}</>
}
