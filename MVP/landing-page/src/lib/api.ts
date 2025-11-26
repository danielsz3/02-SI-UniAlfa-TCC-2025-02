const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      // Adicione token de autenticação aqui se precisar
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Adicione token de autenticação aqui se precisar
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
