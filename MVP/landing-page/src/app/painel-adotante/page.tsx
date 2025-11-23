'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { calcularIdade } from '@/lib/animal-utils'
import { AnimalDetailModal } from '@/components/animal/AnimalDetailModal'
import { Animal } from '@/types'
import { getToken } from '@/lib/api'
import { ArrowRight, CheckCheckIcon, Eye, X } from 'lucide-react'
import Link from 'next/link'
import LoadMoreList from '@/components/LoadMoreList'
import { toast } from 'sonner'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
const USER_KEY = 'user'

const chipTipos: Record<string, { label: string; bgCor: string; textCor: string }> = {
  disponivel: { label: 'Disponível', bgCor: '#1976d2', textCor: '#fff' },
  adotado: { label: 'Adotado', bgCor: '#9c27b0', textCor: '#fff' },
  em_adocao: { label: 'Em Adoção', bgCor: '#425a8fff', textCor: '#fff' },
  em_aprovacao: { label: 'Em Aprovação', bgCor: '#296b2c', textCor: '#fff' },
}

type MatchStatus = 'em_adocao' | 'escolhido' | 'rejeitado' | 'finalizado' | 'anunciados'

type MatchItem = {
  id: number
  status: MatchStatus
  animal: Animal & { situacao?: string }
  observacao: string
  created_at?: string | null
  usuario_id: number
  animal_id: number
}

type User = { id: number;[key: string]: any }

type StatusFilter = MatchStatus

const VALID_STATUSES: StatusFilter[] = [
  'em_adocao',
  'escolhido',
  'rejeitado',
  'finalizado',
  'anunciados',
]

const apiService = {
  getToken: () => getToken(),

  getStoredUserId: (): number | null => {
    if (typeof window === 'undefined') return null
    try {
      const storedUser = localStorage.getItem(USER_KEY)
      if (!storedUser) return null
      const user: User = JSON.parse(storedUser)
      return user?.id || null
    } catch (e) {
      console.error('Falha ao parsear usuário do localStorage', e)
      return null
    }
  },

  getAuthHeaders: () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = apiService.getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  },

  fetch: async (path: string, options: RequestInit = {}): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: apiService.getAuthHeaders(),
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erro de rede')
      throw new Error(errorText || `Erro ${res.status} ao buscar ${path}`)
    }

    return res.json().catch(() => null)
  },
}

/**
 * useAdotanteDataBase agora aceita um refreshKey (number).
 * Quando refreshKey muda, a effect é reexecutada e os counts são recarregados.
 */
function useAdotanteDataBase(refreshKey: number = 0) {
  const [userId, setUserId] = useState<number | null>(null)
  const [counts, setCounts] = useState<Record<StatusFilter, number>>({
    em_adocao: 0,
    escolhido: 0,
    rejeitado: 0,
    finalizado: 0,
    anunciados: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = apiService.getStoredUserId()
    if (id) {
      setUserId(id)
    } else {
      console.error('ID do usuário não encontrado no localStorage.')
      setError('Usuário não autenticado.')
      setLoading(false)
    }
  }, [])

  const fetchWithTotal = async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: apiService.getAuthHeaders(),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => 'Erro de rede')
      throw new Error(text || `Erro ${res.status}`)
    }

    const contentRange = res.headers.get('Content-Range')
    let total: number | null = null
    if (contentRange && contentRange.includes('/')) {
      const parts = contentRange.split('/')
      const maybeTotal = Number(parts[1])
      if (!Number.isNaN(maybeTotal)) total = maybeTotal
    }

    const body = await res.json().catch(() => null)

    if (total == null) {
      if (body) {
        if (Array.isArray(body)) total = body.length
        else if (body?.meta?.total != null) total = Number(body.meta.total)
        else if (body?.total != null) total = Number(body.total)
        else if (body?.data && Array.isArray(body.data)) total = body.data.length
        else if (body?.items && Array.isArray(body.items)) total = body.items.length
      }
    }

    if (total == null) total = 0

    let items = []
    if (Array.isArray(body)) items = body
    else if (body?.data && Array.isArray(body.data)) items = body.data
    else if (body?.items && Array.isArray(body.items)) items = body.items
    else items = []

    return { items, total, headers: res.headers }
  }

  const fetchTotal = async (pathWithoutQuery: string) => {
    const connector = pathWithoutQuery.includes('?') ? '&' : '?'
    const path = `${pathWithoutQuery}${connector}range=[0,0]`
    const { total, items } = await fetchWithTotal(path)
    return total ?? items.length
  }

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    setError(null)

    ; (async () => {
      try {
        const baseMatchesFilter = encodeURIComponent(JSON.stringify({ usuario_id: userId }))
        const baseAnimalsFilter = encodeURIComponent(JSON.stringify({ usuario_id: userId }))

        const anunciadosPromise = fetchTotal(`/animais?filter=${baseAnimalsFilter}`)

        const statusKeys: StatusFilter[] = ['em_adocao', 'escolhido', 'rejeitado', 'finalizado']
        const statusPromises = statusKeys.map((s) => {
          const filter = encodeURIComponent(JSON.stringify({ usuario_id: userId, status: s }))
          return fetchTotal(`/match-afinidades?filter=${filter}`)
        })

        const [anunciadosTotal, ...statusTotals] = await Promise.all([anunciadosPromise, ...statusPromises])

        const newCounts: Record<StatusFilter, number> = {
          em_adocao: statusTotals[0] ?? 0,
          escolhido: statusTotals[1] ?? 0,
          rejeitado: statusTotals[2] ?? 0,
          finalizado: statusTotals[3] ?? 0,
          anunciados: anunciadosTotal ?? 0,
        }

        setCounts(newCounts)
      } catch (e: any) {
        console.error('Erro ao buscar contadores', e)
        setError((e && e.message) || 'Falha ao carregar dados.')
      } finally {
        setLoading(false)
      }
    })()
  }, [userId, refreshKey]) // <-- refreshKey faz re-fetch dos counts

  return { userId, counts, isLoading: loading, error }
}


const PageHeader = () => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-2xl font-semibold">Painel do Adotante</h3>
      <p className="text-sm text-muted-foreground font-medium dark:text-secondary">
        Gerencie seus pedidos, afinidades e anúncios
      </p>
    </div>
    <Button asChild>
      <a href="/adotar" className='text-wrap'>Animais disponíveis</a>
    </Button>
  </div>
)

interface FilterTabsProps {
  counts: Record<StatusFilter, number>
  activeFilter: StatusFilter
  onFilterChange: (filter: StatusFilter) => void
}

const FilterTabs = ({ counts, activeFilter, onFilterChange }: FilterTabsProps) => (
  <div className="mb-6 flex items-center gap-3 flex-wrap">
    {(VALID_STATUSES).map((status) => {
      const isActive = activeFilter === status
      const textMap: Record<StatusFilter, string> = {
        em_adocao: 'Em adoção',
        escolhido: 'Escolhidos',
        rejeitado: 'Rejeitados',
        finalizado: 'Finalizados',
        anunciados: 'Meus Anúncios',
      }

      const activeClass = isActive
        ? 'bg-sky-600 text-white'
        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'

      return (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeClass}`}
        >
          {textMap[status]}
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full">
            {counts[status]}
          </span>
        </button>
      )
    })}
  </div>
)

interface MatchItemCardProps {
  item: MatchItem
  onSee: () => void
  onStatusChanged?: () => void // recebe callback opcional para disparar refresh apenas da lista
}

const MatchItemCard = React.memo(({ item, onSee, onStatusChanged }: MatchItemCardProps) => {
  const router = useRouter()

  const [loadingAction, setLoadingAction] = useState<
    'escolhido' | 'rejeitado' | null
  >(null)

  const handleMudarStatus = async (status: 'escolhido' | 'rejeitado') => {
    if (loadingAction) return

    setLoadingAction(status)

    const toastId = toast.loading(
      status === 'escolhido'
        ? 'A escolher o animal...'
        : 'A rejeitar o animal...'
    )

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/match-afinidades/mudar-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            status,
            animal_id: item.animal.id,
            usuario_id: JSON.parse(localStorage.getItem('user') || '{}').id,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Falha ao mudar status')
      }

      // chama callback para recarregar somente a lista e os counts (se fornecido)
      try {
        onStatusChanged && onStatusChanged()
      } catch (err) {
        console.warn('onStatusChanged callback falhou', err)
      }

      toast.success(`Animal ${status} com sucesso!`, {
        id: toastId,
        action: {
          label: 'Ver lista',
          onClick: () => {
            router.push(`/painel-adotante?status=${status}`)
          },
        },
        actionButtonStyle: {
          backgroundColor: '#0367A6',
          color: 'white',
          fontSize: '0.8rem',
        },
        duration: 3000,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro: ${errorMessage}`, { id: toastId, richColors: true })

      setLoadingAction(null)
    } finally {
      // garante limpar estado de loading
      setLoadingAction(null)
    }
  }

  const { animal, status, created_at, observacao } = item
  const img = animal.imagens?.[0]?.caminho
  const idade = calcularIdade(animal.data_nascimento || '')
  const porte = animal.tamanho ?? ''

  let badgeLabel = ''
  let badgeStyle: React.CSSProperties = {}
  let badgeClass = 'text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap'

  if (status === 'anunciados') {
    const situacaoKey = animal.situacao || 'em_aprovacao'
    const config = chipTipos[situacaoKey] || chipTipos['em_aprovacao']

    badgeLabel = config.label
    badgeStyle = {
      backgroundColor: config.bgCor,
      color: config.textCor,
    }
  } else {
    const statusTextMap: Record<string, string> = {
      em_adocao: 'Em adoção',
      escolhido: 'Escolhido',
      rejeitado: 'Rejeitado',
      finalizado: 'Finalizado',
    }

    badgeLabel = statusTextMap[status] || status

    if (status === 'escolhido') badgeClass += ' bg-emerald-600 text-white'
    else if (status === 'rejeitado') badgeClass += ' bg-rose-700 text-white'
    else if (status === 'finalizado') badgeClass += ' bg-sky-600 text-white'
    else badgeClass += ' bg-yellow-600 text-white'
  }

  return (
    <Card
      onClick={onSee}
      className="flex items-center gap-4 p-3 hover:shadow-lg hover:bg-muted/5 transition-all w-full cursor-pointer relative group"
    >
      <div className="w-20 h-20 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {img ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/imagens/` + img}
            alt={animal.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-xs text-muted-foreground">Sem foto</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold truncate group-hover:text-primary transition-colors">{animal.nome}</h4>
            <p className="text-sm text-muted-foreground truncate text-wrap">
              {[idade, porte].filter(Boolean).join(' • ')}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === 'anunciados' ? 'Criado em: ' : 'Pedido: '}
              {new Date(created_at ?? Date.now()).toLocaleDateString('pt-BR')}
            </p>
            {observacao && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {observacao}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-col min-w-[20%]">
            <div className={badgeClass} style={badgeStyle}>
              {badgeLabel}
            </div>

            <div className="flex items-center gap-2">

              {status === 'rejeitado' && (
                <Button
                  size="sm"
                  className="dark:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMudarStatus('escolhido')
                  }}
                >
                  <CheckCheckIcon className="w-4 h-4" />
                </Button>
              )}

              {status === 'escolhido' && (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="dark:text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMudarStatus('rejeitado')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Link href={`/adotar/form?animal_id=${animal.id}`}>
                      <Button size="sm">
                        Adotar <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
})

MatchItemCard.displayName = 'MatchItemCard'

export default function PainelAdotantePage() {
  // refreshKey controla remount do LoadMoreList e re-fetch dos counts
  const [refreshKey, setRefreshKey] = useState(0)

  const { userId, counts, isLoading, error } = useAdotanteDataBase(refreshKey)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlStatus = searchParams.get('status') as StatusFilter
  const statusFilter = VALID_STATUSES.includes(urlStatus) ? urlStatus : 'em_adocao'

  const handleFilterChange = (newStatus: StatusFilter) => {
    const params = new URLSearchParams(searchParams)
    params.set('status', newStatus)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)

  // Função que vamos passar para os Cards para disparar um refresh local:
  const handleReloadList = () => {
    // incrementa a chave: remonta LoadMoreList e disparará o useAdotanteDataBase por refreshKey
    setRefreshKey((k) => k + 1)
  }

  const fetchMatchesPage = async (start: number, end: number) => {
    if (!userId) {
      return { data: [], total: 0 }
    }

    try {
      let data: MatchItem[] = []
      let total = 0

      if (statusFilter === 'anunciados') {
        const filter = encodeURIComponent(JSON.stringify({ usuario_id: userId }))
        const sort = encodeURIComponent(JSON.stringify(['updated_at', 'DESC']))

        const res = await fetch(
          `${API_BASE}/animais?filter=${filter}&sort=${sort}&range=[${start},${end}]`,
          {
            headers: apiService.getAuthHeaders(),
          }
        )

        if (!res.ok) {
          throw new Error('Erro ao buscar animais')
        }

        const animalsData = await res.json()
        const animals = Array.isArray(animalsData) ? animalsData : animalsData?.data ?? animalsData?.items ?? []

        data = animals.map((animal: Animal) => ({
          id: animal.id,
          status: 'anunciados' as MatchStatus,
          animal: animal,
          observacao: '',
          created_at: animal.created_at,
          usuario_id: userId,
          animal_id: animal.id,
        }))

        const contentRange = res.headers.get('Content-Range')
        total = contentRange ? Number(contentRange.split('/')[1]) : counts.anunciados
      } else {
        const filter = encodeURIComponent(JSON.stringify({
          usuario_id: userId,
          status: statusFilter
        }))
        const sort = encodeURIComponent(JSON.stringify(['created_at', 'DESC']))

        const res = await fetch(
          `${API_BASE}/match-afinidades?filter=${filter}&sort=${sort}&range=[${start},${end}]`,
          {
            headers: apiService.getAuthHeaders(),
          }
        )

        if (!res.ok) {
          throw new Error('Erro ao buscar matches')
        }

        const matchesData = await res.json()
        data = Array.isArray(matchesData) ? matchesData : matchesData?.data ?? matchesData?.items ?? []

        const contentRange = res.headers.get('Content-Range')
        total = contentRange ? Number(contentRange.split('/')[1]) : counts[statusFilter]
      }

      if (!total || total === 0) {
        total = start + data.length
      }

      return { data, total }
    } catch (e) {
      console.error('Erro ao buscar página:', e)
      return { data: [], total: 0 }
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <PageHeader />
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Carregando dados...</div>
        </div>
      </div>
    )
  }

  if (error || !userId) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <PageHeader />
        <div className="flex justify-center items-center py-12">
          <div className="text-red-500">Erro: {error ?? 'Usuário não autenticado.'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader />

      <FilterTabs
        counts={counts}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
      />

      <LoadMoreList
        // a key inclui refreshKey para forçar remount somente quando necessário
        key={`${statusFilter}-${refreshKey}`}
        step={8}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        fetchData={fetchMatchesPage}
        renderItem={(item: MatchItem) => (
          <MatchItemCard
            item={item}
            onSee={() => setSelectedAnimal(item.animal)}
            onStatusChanged={handleReloadList} // <-- passado para chamada somente da lista
          />
        )}
      />

      <AnimalDetailModal
        buttonAdotar={false}
        initialData={selectedAnimal}
        onClose={() => setSelectedAnimal(null)}
      />
    </div>
  )
}
