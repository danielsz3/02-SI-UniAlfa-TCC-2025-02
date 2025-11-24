import { useQuery, keepPreviousData } from '@tanstack/react-query';

// --- Tipos para o Hook ---

/**
 * Padrão de paginação do React-Admin/MUI.
 */
interface Pagination {
    page: number; // A página atual (começando em 1)
    perPage: number; // Quantos itens por página
}

/**
 * Padrão de ordenação.
 */
interface Sort {
    field: string; // Campo para ordenar
    order: 'ASC' | 'DESC'; // Direção
}

/**
 * Os filtros são um objeto simples.
 */
type Filter = Record<string, any>;

/**
 * O que o hook retorna: os dados e o total (para paginação).
 */
interface UseApiSearchResult<T> {
    data: T[] | undefined;
    total: number | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isFetching: boolean;
}

// --- A Função de Busca (Fetch) ---

/**
 * Esta função é a que realmente busca os dados e entende a Trait do PHP.
 * @param resource O endpoint da API (ex: 'animais', 'usuarios')
 * @param pagination Objeto { page, perPage }
 * @param sort Objeto { field, order }
 * @param filter Objeto de filtros (ex: { nome_like: 'Rex', 'q': 'termo' })
 */
const fetchApiSearch = async (
    resource: string,
    pagination: Pagination,
    sort: Sort,
    filter: Filter
): Promise<{ data: any[]; total: number }> => {

    // 1. Converter Paginação para 'range'
    const { page, perPage } = pagination;
    const start = (page - 1) * perPage;
    const end = page * perPage - 1;
    const range = JSON.stringify([start, end]);

    // 2. Converter Ordenação para 'sort'
    const sortParam = JSON.stringify([sort.field, sort.order]);

    // 3. Converter Filtros para 'filter'
    const filterParam = JSON.stringify(filter);

    // 4. Montar a Query String
    const params = new URLSearchParams();
    params.set('filter', filterParam);
    params.set('range', range);
    params.set('sort', sortParam);

    const token = localStorage.getItem('authToken');
    const url = `${import.meta.env.VITE_API_URL}/${resource}?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(
            errorData.message ||
            `Falha ao buscar recurso '${resource}' (Status: ${response.status})`
        );
    }

    // 5. Ler o Total do Cabeçalho 'Content-Range'
    // A Trait retorna: "items 0-9/100"
    const contentRange = response.headers.get('Content-Range');
    let total = 0;

    if (contentRange) {
        const totalMatch = contentRange.match(/\/(\d+)/);
        if (totalMatch) {
            total = parseInt(totalMatch[1], 10);
        }
    }

    const data = await response.json();

    return { data, total };
};


/**
 * Hook personalizado para buscar dados de listagem da API 
 * que usa a Trait `SearchIndex`.
 * * @param resource O recurso da API (ex: 'animais')
 * @param pagination Objeto { page, perPage }
 * @param sort Objeto { field, order }
 * @param filter Objeto de filtros
 */
export const useApiSearch = <T = any>(
    resource: string,
    pagination: Pagination,
    sort: Sort,
    filter: Filter
): UseApiSearchResult<T> => {
    
    // A chave da query inclui todos os parâmetros para 
    // garantir que o cache seja atualizado quando algo mudar.
    const queryKey = [resource, pagination, sort, filter];

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: queryKey,
        queryFn: () => fetchApiSearch(resource, pagination, sort, filter),
        // Mantém os dados anteriores enquanto carrega novos (bom para paginação)
        placeholderData: keepPreviousData, 
        retry: 2,
    });

    return {
        data: data?.data as T[],
        total: data?.total,
        isLoading,
        isError,
        error: error as Error | null,
        isFetching,
    };
};