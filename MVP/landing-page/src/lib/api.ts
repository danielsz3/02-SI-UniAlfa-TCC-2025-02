import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function decodeToken(token: string): any {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp < now
}

export function getToken(): string | null {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('token')

    if (!token) {
        clearAuthData(true)
        toast.error('Voce precisa estar autenticado, faça o login.', { richColors: true })
        return null
    }

    if (isTokenExpired(token)) {
        clearAuthData(true)
        toast.error('Token expirado, faça o login novamente.', { richColors: true })
        return null
    }

    return token
}

export function clearAuthData(shouldRedirect = true, loginPath = '/login') {
    if (typeof window === 'undefined') return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new CustomEvent('auth:logout'))

    if (!shouldRedirect) return

    if (window.location.pathname === loginPath) return

    try {
        window.location.replace(loginPath)

    } catch {

        window.location.href = loginPath
    }
}
async function handlePossibleError(res: Response) {
    if (!res.ok) {
        if (res.status === 401) {
            clearAuthData(true)
        }
        let body: any
        try {
            body = await res.json()
        } catch {
            body = await res.text().catch(() => '')
        }
        throw new Error(`API error: ${res.status} ${JSON.stringify(body)}`)
    }
    return res
}

export async function apiGet<T>(endpoint: string): Promise<T> {
    const token = getToken()
    const res = await fetch(`${API_URL}/${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    await handlePossibleError(res)
    return res.json()
}

export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
    const token = getToken()
    const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
    })

    await handlePossibleError(res)
    return res.json()
}

export async function apiMultipart<T>(
    endpoint: string,
    formData: FormData,
    options?: { method?: 'POST' | 'PUT' | 'PATCH'; useMethodOverride?: boolean }
): Promise<T> {
    const token = getToken()
    const method = options?.method ?? 'POST'
    const useMethodOverride = options?.useMethodOverride ?? true

    if ((method === 'PUT' || method === 'PATCH') && useMethodOverride) {
        formData.set('_method', method)
    }

    const fetchMethod = method === 'POST' || useMethodOverride ? 'POST' : (method as RequestInit['method'])

    const res = await fetch(`${API_URL}/${endpoint}`, {
        method: fetchMethod,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),

        },
        body: formData,
    })

    await handlePossibleError(res)
    return res.json()
}
